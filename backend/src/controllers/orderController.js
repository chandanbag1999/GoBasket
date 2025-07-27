const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const socketService = require('../services/socketService');

// Place order from cart (Checkout)
exports.checkout = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      deliveryAddressId,
      paymentMethod,
      specialInstructions,
      orderType = 'delivery'
    } = req.body;

    // Find user's active cart
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    })
      .populate('restaurant', 'name restaurantProfile')
      .populate('items.product', 'name description images preparationTime');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items in cart to checkout'
      });
    }

    // Get user with addresses
    const user = await User.findById(req.user._id);
    let deliveryAddress = null;

    if (orderType === 'delivery') {
      if (!deliveryAddressId) {
        return res.status(400).json({
          success: false,
          error: 'Delivery address is required for delivery orders'
        });
      }

      const address = user.addresses.id(deliveryAddressId);
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Invalid delivery address'
        });
      }

      deliveryAddress = {
        title: address.title,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        coordinates: address.coordinates,
        contactPhone: user.phone
      };
    }

    // Verify all products are still available
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || !product.isAvailable || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: `Product "${item.productSnapshot.name}" is no longer available`
        });
      }
    }

    // Calculate preparation time
    const estimatedPreparationTime = Math.max(
      ...cart.items.map(item => 
        item.selectedVariant?.preparationTime || 
        item.product.preparationTime || 
        15
      )
    );

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date(
      Date.now() + (estimatedPreparationTime + 30) * 60 * 1000 // prep time + 30 min delivery
    );

    // Prepare order items with snapshots
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productSnapshot: {
        name: item.product.name,
        description: item.product.description,
        basePrice: item.productSnapshot.basePrice,
        image: item.product.defaultImage?.secure_url,
        restaurant: cart.restaurant._id,
        restaurantName: cart.restaurant.restaurantProfile?.restaurantName || cart.restaurant.name
      },
      selectedVariant: item.selectedVariant,
      customizations: item.customizations,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specialInstructions: item.specialInstructions
    }));

    // Create order
    const order = new Order({
      customer: req.user._id,
      restaurant: cart.restaurant._id,
      items: orderItems,
      deliveryAddress,
      pricing: {
        subtotal: cart.subtotal,
        taxes: {
          gst: cart.taxes.gst,
          serviceCharge: cart.taxes.serviceCharge
        },
        deliveryFee: orderType === 'delivery' ? cart.deliveryFee : 0,
        total: orderType === 'delivery' ? cart.total : (cart.subtotal + cart.taxes.gst + cart.taxes.serviceCharge)
      },
      estimatedPreparationTime,
      estimatedDeliveryTime,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
      },
      orderType,
      specialInstructions: specialInstructions || '',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date()
      }]
    });

    await order.save();
    socketService.emitNewOrderNotification(order);

    // Mark cart as converted
    cart.status = 'converted';
    await cart.save();

    // Populate order for response
    await order.populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'restaurant', select: 'name restaurantProfile' }
    ]);

    logger.info('Order placed successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: req.user._id,
      restaurantId: cart.restaurant._id,
      total: order.pricing.total,
      itemCount: order.items.length,
      paymentMethod,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! 🎉',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          total: order.pricing.total,
          paymentMethod: order.payment.method,
          restaurant: order.restaurant
        }
      }
    });

  } catch (error) {
    logger.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during checkout'
    });
  }
};

// Get order details
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name restaurantProfile')
      .populate('deliveryPersonnel', 'name phone deliveryProfile');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access permissions
    const hasAccess = (
      order.customer._id.toString() === req.user._id.toString() ||
      order.restaurant._id.toString() === req.user._id.toString() ||
      order.deliveryPersonnel?._id.toString() === req.user._id.toString() ||
      ['admin', 'sub-admin'].includes(req.user.role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching order'
    });
  }
};

// Get user order history
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('restaurant', 'name restaurantProfile.restaurantName')
      .populate('deliveryPersonnel', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: {
        orders
      }
    });

  } catch (error) {
    logger.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching orders'
    });
  }
};

// Get restaurant orders (Restaurant Owner)
exports.getRestaurantOrders = async (req, res) => {
  try {
    logger.info('Get restaurant orders request started', {
      userId: req.user?._id,
      userRole: req.user?.role,
      query: req.query,
      ip: req.ip
    });

    const { page = 1, limit = 20, status } = req.query;

    logger.info('Query parameters parsed', {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      restaurantId: req.user._id
    });

    logger.info('Fetching restaurant orders from database');
    const orders = await Order.getRestaurantOrders(
      req.user._id,
      status,
      parseInt(page),
      parseInt(limit)
    );

    logger.info('Orders fetched successfully', {
      ordersCount: orders.length,
      restaurantId: req.user._id
    });

    logger.info('Counting total orders for pagination');
    const totalQuery = { restaurant: req.user._id };
    if (status) totalQuery.status = status;
    const total = await Order.countDocuments(totalQuery);

    logger.info('Total count calculated', {
      total,
      query: totalQuery
    });

    const response = {
      success: true,
      count: orders.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      data: {
        orders
      }
    };

    logger.info('Restaurant orders fetched successfully', {
      userId: req.user._id,
      ordersCount: orders.length,
      total,
      page: parseInt(page)
    });

    res.status(200).json(response);

  } catch (error) {
    logger.error('Get restaurant orders error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      userRole: req.user?.role,
      query: req.query
    });
    res.status(500).json({
      success: false,
      error: 'Server error fetching restaurant orders',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
};

// Update order status (Restaurant Owner, Delivery Personnel, Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status, reason, notes } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check permissions
    const canUpdate = (
      (req.user.role === 'restaurant-owner' && order.restaurant.toString() === req.user._id.toString()) ||
      (req.user.role === 'delivery-personnel' && order.deliveryPersonnel?.toString() === req.user._id.toString()) ||
      ['admin', 'sub-admin'].includes(req.user.role)
    );

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up'],
      'picked_up': ['out_for_delivery'],
      'out_for_delivery': ['delivered'],
      'delivered': [], // Terminal state
      'cancelled': [], // Terminal state
      'refunded': []   // Terminal state
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update order status
    await order.updateStatus(status, req.user._id, reason, notes);
    socketService.emitOrderStatusUpdate(order);

    // Populate for response
    await order.populate([
      { path: 'customer', select: 'name phone' },
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'deliveryPersonnel', select: 'name phone' }
    ]);

    logger.info('Order status updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus: validTransitions[order.status] ? Object.keys(validTransitions).find(key => validTransitions[key].includes(status)) : 'unknown',
      newStatus: status,
      updatedBy: req.user._id,
      reason,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating order status'
    });
  }
};

// Cancel order (Customer, Restaurant Owner, Admin)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required (minimum 5 characters)'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check permissions
    const canCancel = (
      order.customer.toString() === req.user._id.toString() ||
      (req.user.role === 'restaurant-owner' && order.restaurant.toString() === req.user._id.toString()) ||
      ['admin', 'sub-admin'].includes(req.user.role)
    );

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled in ${order.status} status`
      });
    }

    // Cancel order
    await order.cancel(reason.trim(), req.user._id);

    logger.info('Order cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      cancelledBy: req.user._id,
      reason: reason.trim(),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancellation: order.cancellation
        }
      }
    });

  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error cancelling order'
    });
  }
};

// Assign delivery personnel to order (Admin, Sub-admin)
exports.assignDeliveryPersonnel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonnelId } = req.body;

    if (!deliveryPersonnelId) {
      return res.status(400).json({
        success: false,
        error: 'Delivery personnel ID is required'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Verify delivery personnel exists and is available
    const deliveryPerson = await User.findOne({
      _id: deliveryPersonnelId,
      role: 'delivery-personnel',
      isActive: true,
      'deliveryProfile.isAvailable': true
    });

    if (!deliveryPerson) {
      return res.status(400).json({
        success: false,
        error: 'Delivery personnel not found or not available'
      });
    }

    // Check if order is ready for delivery assignment
    if (!['ready', 'picked_up'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order must be ready for delivery assignment'
      });
    }

    // Assign delivery personnel
    await order.assignDeliveryPersonnel(deliveryPersonnelId);
    socketService.emitDeliveryAssignment(order);

    logger.info('Delivery personnel assigned to order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryPersonnelId,
      assignedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Delivery personnel assigned successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          deliveryPersonnel: deliveryPersonnelId,
          assignedAt: order.deliveryTracking.assignedAt
        }
      }
    });

  } catch (error) {
    logger.error('Assign delivery personnel error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error assigning delivery personnel'
    });
  }
};

// Add rating and review to order (Customer only)
exports.addOrderRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { orderId } = req.params;
    const { overall, food, delivery, review } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if customer owns this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to rate this order'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Can only rate delivered orders'
      });
    }

    // Check if already rated
    if (order.rating.overall) {
      return res.status(400).json({
        success: false,
        error: 'Order has already been rated'
      });
    }

    // Add rating
    await order.addRating({
      overall,
      food,
      delivery,
      review: review?.trim()
    });

    logger.info('Order rating added', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: req.user._id,
      rating: { overall, food, delivery },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback! 🌟',
      data: {
        rating: order.rating
      }
    });

  } catch (error) {
    logger.error('Add order rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding rating'
    });
  }
};

// Get order tracking details
exports.getOrderTracking = async (req, res) => {
  try {
    logger.info('Get order tracking request started', {
      userId: req.user?._id,
      orderId: req.params.orderId,
      userRole: req.user?.role,
      ip: req.ip
    });

    const { orderId } = req.params;

    logger.info('Fetching order details', { orderId });

    const order = await Order.findById(orderId)
      .populate('deliveryPersonnel', 'name phone deliveryProfile')
      .select('orderNumber status statusHistory deliveryTracking estimatedDeliveryTime customer restaurant');

    if (!order) {
      logger.warn('Order not found', { orderId });
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    logger.info('Order found', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerId: order.customer?.toString(),
      restaurantId: order.restaurant?.toString(),
      deliveryPersonnelId: order.deliveryPersonnel?._id?.toString()
    });

    // Check access permissions
    const hasAccess = (
      order.customer?.toString() === req.user._id.toString() ||
      order.restaurant?.toString() === req.user._id.toString() ||
      order.deliveryPersonnel?._id?.toString() === req.user._id.toString() ||
      ['admin', 'sub-admin'].includes(req.user.role)
    );

    logger.info('Access permission check', {
      userId: req.user._id.toString(),
      userRole: req.user.role,
      isCustomer: order.customer?.toString() === req.user._id.toString(),
      isRestaurant: order.restaurant?.toString() === req.user._id.toString(),
      isDeliveryPersonnel: order.deliveryPersonnel?._id?.toString() === req.user._id.toString(),
      isAdmin: ['admin', 'sub-admin'].includes(req.user.role),
      hasAccess
    });

    if (!hasAccess) {
      logger.warn('Access denied for order tracking', {
        userId: req.user._id.toString(),
        orderId,
        userRole: req.user.role
      });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to track this order'
      });
    }

    // Calculate progress percentage
    const statusProgress = {
      'pending': 10,
      'confirmed': 25,
      'preparing': 50,
      'ready': 65,
      'picked_up': 75,
      'out_for_delivery': 90,
      'delivered': 100,
      'cancelled': 0
    };

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        progress: statusProgress[order.status] || 0,
        statusHistory: order.statusHistory,
        deliveryTracking: order.deliveryTracking,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        deliveryPersonnel: order.deliveryPersonnel
      }
    });

  } catch (error) {
    logger.error('Get order tracking error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      orderId: req.params?.orderId,
      userRole: req.user?.role
    });
    res.status(500).json({
      success: false,
      error: 'Server error fetching order tracking',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
};


