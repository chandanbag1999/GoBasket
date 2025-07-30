const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { queues } = require('../config/queue');

const orderProcessor = async (job) => {
  const { type, data } = job.data;
  
  try {
    let result;
    
    switch (type) {
      case 'process_new_order':
        result = await processNewOrder(data);
        break;
        
      case 'auto_confirm_order':
        result = await autoConfirmOrder(data);
        break;
        
      case 'check_preparation_timeout':
        result = await checkPreparationTimeout(data);
        break;
        
      case 'update_order_analytics':
        result = await updateOrderAnalytics(data);
        break;
        
      default:
        throw new Error(`Unknown order processing type: ${type}`);
    }
    
    return {
      success: true,
      processingType: type,
      result
    };
    
  } catch (error) {
    logger.error('Order processor error:', {
      jobId: job.id,
      processingType: type,
      error: error.message,
      data
    });
    throw error;
  }
};

const processNewOrder = async (data) => {
  const { orderId } = data;
  
  const order = await Order.findById(orderId)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name restaurantProfile');
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Send order confirmation notifications
  await queues.emailQueue.add('send_email', {
    type: 'order_confirmation',
    data: {
      user: order.customer,
      order
    }
  });
  
  await queues.smsQueue.add('send_sms', {
    type: 'order_confirmation',
    data: {
      user: order.customer,
      order
    }
  });
  
  // Schedule auto-confirmation after 2 minutes if restaurant doesn't respond
  await queues.orderQueue.add('auto_confirm_order', {
    orderId
  }, {
    delay: 2 * 60 * 1000 // 2 minutes
  });
  
  logger.info('New order processed successfully', {
    orderId,
    orderNumber: order.orderNumber
  });
  
  return { orderId, notificationsSent: true };
};

const autoConfirmOrder = async (data) => {
  const { orderId } = data;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { skipped: true, reason: 'Order not found' };
  }
  
  // Only auto-confirm if still pending
  if (order.status === 'pending') {
    await order.updateStatus('confirmed', null, 'Auto-confirmed after timeout', 'System auto-confirmation');
    
    logger.info('Order auto-confirmed', {
      orderId,
      orderNumber: order.orderNumber
    });
    
    return { autoConfirmed: true };
  }
  
  return { skipped: true, reason: `Order already in ${order.status} status` };
};

const checkPreparationTimeout = async (data) => {
  const { orderId } = data;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { skipped: true, reason: 'Order not found' };
  }
  
  // Check if preparation is taking too long
  const preparationTime = Date.now() - order.createdAt.getTime();
  const maxPreparationTime = (order.estimatedPreparationTime + 15) * 60 * 1000; // Add 15 min buffer
  
  if (preparationTime > maxPreparationTime && ['confirmed', 'preparing'].includes(order.status)) {
    logger.warn('Order preparation timeout', {
      orderId,
      orderNumber: order.orderNumber,
      preparationTime: Math.round(preparationTime / 60000),
      estimatedTime: order.estimatedPreparationTime
    });
    
    // Notify customer about delay
    await queues.emailQueue.add('send_email', {
      type: 'order_delay_notification',
      data: {
        user: order.customer,
        order,
        delayMinutes: Math.round((preparationTime - maxPreparationTime) / 60000)
      }
    });
    
    return { delayNotificationSent: true };
  }
  
  return { skipped: true, reason: 'Within time limits' };
};

const updateOrderAnalytics = async (data) => {
  const { orderId, action } = data;
  
  // This would update various analytics in the database
  // For now, just log the analytics update
  logger.info('Order analytics updated', {
    orderId,
    action,
    timestamp: new Date()
  });
  
  return { analyticsUpdated: true };
};

module.exports = orderProcessor;
