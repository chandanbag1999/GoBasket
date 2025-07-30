const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { queues } = require('../config/queue');

const deliveryProcessor = async (job) => {
  const { type, data } = job.data;
  
  try {
    let result;
    
    switch (type) {
      case 'auto_assign_delivery':
        result = await autoAssignDelivery(data);
        break;
        
      case 'find_nearby_delivery_personnel':
        result = await findNearbyDeliveryPersonnel(data);
        break;
        
      case 'notify_delivery_assignment':
        result = await notifyDeliveryAssignment(data);
        break;
        
      default:
        throw new Error(`Unknown delivery processing type: ${type}`);
    }
    
    return {
      success: true,
      processingType: type,
      result
    };
    
  } catch (error) {
    logger.error('Delivery processor error:', {
      jobId: job.id,
      processingType: type,
      error: error.message,
      data
    });
    throw error;
  }
};

const autoAssignDelivery = async (data) => {
  const { orderId } = data;
  
  const order = await Order.findById(orderId)
    .populate('customer', 'name phone')
    .populate('restaurant', 'name restaurantProfile');
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Only assign if order is ready and no delivery person assigned
  if (order.status !== 'ready' || order.deliveryPersonnel) {
    return { 
      skipped: true, 
      reason: `Order status: ${order.status}, Already assigned: ${!!order.deliveryPersonnel}` 
    };
  }
  
  // Find available delivery personnel near restaurant
  const nearbyDeliveryPersonnel = await findNearbyDeliveryPersonnel({
    restaurantLocation: order.restaurant.addresses?.[0]?.coordinates,
    maxDistance: 5000, // 5km radius
    orderId
  });
  
  if (nearbyDeliveryPersonnel.length === 0) {
    logger.warn('No available delivery personnel found', {
      orderId,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurant._id
    });
    
    // Retry after 5 minutes
    await queues.deliveryQueue.add('auto_assign_delivery', {
      orderId
    }, {
      delay: 5 * 60 * 1000 // 5 minutes
    });
    
    return { retry: true, reason: 'No available delivery personnel' };
  }
  
  // Assign the closest available delivery person
  const selectedDeliveryPerson = nearbyDeliveryPersonnel[0];
  
  await order.assignDeliveryPersonnel(selectedDeliveryPerson._id);
  
  // Update delivery person availability
  await User.findByIdAndUpdate(selectedDeliveryPerson._id, {
    'deliveryProfile.isAvailable': false
  });
  
  // Send notifications
  await queues.deliveryQueue.add('notify_delivery_assignment', {
    orderId,
    deliveryPersonnelId: selectedDeliveryPerson._id
  });
  
  logger.info('Delivery personnel auto-assigned', {
    orderId,
    orderNumber: order.orderNumber,
    deliveryPersonnelId: selectedDeliveryPerson._id,
    deliveryPersonName: selectedDeliveryPerson.name
  });
  
  return {
    assigned: true,
    deliveryPersonnel: {
      id: selectedDeliveryPerson._id,
      name: selectedDeliveryPerson.name,
      phone: selectedDeliveryPerson.phone
    }
  };
};

const findNearbyDeliveryPersonnel = async (data) => {
  const { restaurantLocation, maxDistance = 5000, orderId } = data;
  
  if (!restaurantLocation || !restaurantLocation.latitude || !restaurantLocation.longitude) {
    logger.warn('Restaurant location not available for delivery assignment', { orderId });
    return [];
  }
  
  // Find available delivery personnel near the restaurant
  const deliveryPersonnel = await User.find({
    role: 'delivery-personnel',
    isActive: true,
    'deliveryProfile.isAvailable': true,
    'deliveryProfile.currentLocation.latitude': { $exists: true },
    'deliveryProfile.currentLocation.longitude': { $exists: true }
  }).select('name phone deliveryProfile');
  
  // Calculate distance and filter by maxDistance
  const nearbyPersonnel = deliveryPersonnel.filter(person => {
    const personLocation = person.deliveryProfile.currentLocation;
    const distance = calculateDistance(
      restaurantLocation.latitude,
      restaurantLocation.longitude,
      personLocation.latitude,
      personLocation.longitude
    );
    
    person.distance = distance;
    return distance <= maxDistance;
  });
  
  // Sort by distance (closest first)
  nearbyPersonnel.sort((a, b) => a.distance - b.distance);
  
  logger.info('Found nearby delivery personnel', {
    orderId,
    count: nearbyPersonnel.length,
    maxDistance,
    restaurantLocation
  });
  
  return nearbyPersonnel;
};

const notifyDeliveryAssignment = async (data) => {
  const { orderId, deliveryPersonnelId } = data;
  
  const order = await Order.findById(orderId)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name restaurantProfile')
    .populate('deliveryPersonnel', 'name phone');
  
  if (!order || !order.deliveryPersonnel) {
    throw new Error('Order or delivery personnel not found');
  }
  
  // Notify customer about delivery assignment
  await queues.emailQueue.add('send_email', {
    type: 'delivery_assigned',
    data: {
      user: order.customer,
      order,
      deliveryPerson: order.deliveryPersonnel
    }
  });
  
  await queues.smsQueue.add('send_sms', {
    type: 'delivery_assigned',
    data: {
      user: order.customer,
      order,
      deliveryPerson: order.deliveryPersonnel
    }
  });
  
  // Notify delivery personnel (could be push notification in real app)
  logger.info('Delivery assignment notifications sent', {
    orderId,
    deliveryPersonnelId,
    customerNotified: true
  });
  
  return { notificationsSent: true };
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon1 - lon2) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
};

module.exports = deliveryProcessor;
