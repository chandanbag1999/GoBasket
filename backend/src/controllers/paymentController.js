const Order = require('../models/Order');
const razorpayService = require('../config/razorpay');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Create payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { orderId } = req.body;

    // Get the order
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name restaurantProfile.restaurantName');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pay for this order'
      });
    }

    // Check if order is in payable state
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be paid in current status'
      });
    }

    // Check if payment is already completed
    if (order.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(order.pricing.total * 100), // Convert to paise
      receipt: `order_${order.orderNumber}`,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customer._id.toString(),
        customerName: order.customer.name,
        restaurantId: order.restaurant._id.toString()
      }
    };

    const razorpayOrder = await razorpayService.createOrder(razorpayOrderData);

    if (!razorpayOrder.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        details: razorpayOrder.error
      });
    }

    // Update order with Razorpay order ID
    order.payment.transactionId = razorpayOrder.order.id;
    await order.save();

    logger.info('Payment order created successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.order.id,
      amount: order.pricing.total,
      customerId: req.user._id,
      ip: req.ip
    });

    // Return payment details for frontend
    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        razorpayOrder: {
          id: razorpayOrder.order.id,
          amount: razorpayOrder.order.amount,
          currency: razorpayOrder.order.currency
        },
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          total: order.pricing.total
        },
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID // For frontend checkout
      }
    });

  } catch (error) {
    logger.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating payment order'
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // Get the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to verify payment for this order'
      });
    }

    // Verify Razorpay order ID matches
    if (order.payment.transactionId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID for payment verification'
      });
    }

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      logger.warn('Invalid payment signature', {
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed - invalid signature'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);

    if (!paymentDetails.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch payment details'
      });
    }

    const payment = paymentDetails.payment;

    // Update order payment status
    order.payment.status = 'completed';
    order.payment.transactionId = razorpay_order_id;
    order.payment.paymentGateway = 'razorpay';
    order.payment.paidAt = new Date();

    // Add payment details
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.paymentMethod = payment.method; // card, upi, netbanking, wallet
    order.payment.paymentDetails = {
      method: payment.method,
      bank: payment.bank,
      wallet: payment.wallet,
      upi: payment.upi,
      card: payment.card ? {
        last4: payment.card.last4,
        network: payment.card.network,
        type: payment.card.type,
        issuer: payment.card.issuer
      } : null
    };

    // If order is still pending, move to confirmed
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        reason: 'Payment completed successfully'
      });
    }

    await order.save();

    logger.info('Payment verified and completed successfully', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: razorpay_payment_id,
      amount: payment.amount / 100, // Convert from paise
      paymentMethod: payment.method,
      customerId: req.user._id,
      ip: req.ip
    });

    // Emit real-time notification (if socket service is available)
    try {
      const socketService = require('../services/socketService');
      socketService.emitOrderStatusUpdate(order);
    } catch (error) {
      logger.warn('Socket notification failed:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully! 🎉',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.payment.status,
          total: order.pricing.total
        },
        payment: {
          id: razorpay_payment_id,
          method: payment.method,
          amount: payment.amount / 100,
          status: payment.status
        }
      }
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error verifying payment'
    });
  }
};

// Handle payment failure
exports.handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, error } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update payment status to failed
    order.payment.status = 'failed';
    order.payment.failureReason = error.description || 'Payment failed';
    order.payment.failedAt = new Date();

    await order.save();

    logger.warn('Payment failed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpay_order_id,
      error: error,
      customerId: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: false,
      message: 'Payment failed. Please try again.',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.payment.status
        },
        error: error
      }
    });

  } catch (error) {
    logger.error('Handle payment failure error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error handling payment failure'
    });
  }
};

// Get payment history for user
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 
      customer: req.user._id,
      'payment.status': { $in: ['completed', 'failed'] }
    };

    if (status) {
      query['payment.status'] = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('restaurant', 'name restaurantProfile.restaurantName')
      .select('orderNumber pricing payment status createdAt')
      .sort({ 'payment.paidAt': -1, createdAt: -1 })
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
        payments: orders
      }
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching payment history'
    });
  }
};

// Get payment analytics for restaurant (Restaurant Owner)
exports.getRestaurantPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {
      restaurant: req.user._id,
      'payment.status': 'completed'
    };

    if (startDate && endDate) {
      matchQuery['payment.paidAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$pricing.total' },
          paymentMethods: {
            $push: '$payment.paymentMethod'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      }
    ]);

    // Payment method breakdown
    const paymentMethodStats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$payment.paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        analytics: analytics[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0
        },
        paymentMethodBreakdown: paymentMethodStats
      }
    });

  } catch (error) {
    logger.error('Get restaurant payment analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching payment analytics'
    });
  }
};

