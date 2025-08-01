const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId mapping
    this.orderRooms = new Map();  // orderId -> [socketIds] mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email role');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userName = user.name;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.io initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user socket mapping
    this.userSockets.set(userId, socket.id);

    logger.info('User connected to socket', {
      userId,
      socketId: socket.id,
      userRole: socket.userRole,
      userName: socket.userName
    });

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Join role-based rooms
    if (socket.userRole === 'admin' || socket.userRole === 'sub-admin') {
      socket.join('admin_room');
    } else if (socket.userRole === 'restaurant-owner') {
      socket.join(`restaurant_${userId}`);
    } else if (socket.userRole === 'delivery-personnel') {
      socket.join(`delivery_${userId}`);
    }

    // Handle order tracking subscription
    socket.on('join_order_tracking', (orderId) => {
      this.joinOrderTracking(socket, orderId);
    });

    // Handle leaving order tracking
    socket.on('leave_order_tracking', (orderId) => {
      this.leaveOrderTracking(socket, orderId);
    });

    // Handle delivery location updates
    socket.on('update_delivery_location', (data) => {
      this.updateDeliveryLocation(socket, data);
    });

    // Handle typing indicators for order chat
    socket.on('typing_start', (orderId) => {
      socket.to(`order_${orderId}`).emit('user_typing', {
        userId,
        userName: socket.userName
      });
    });

    socket.on('typing_stop', (orderId) => {
      socket.to(`order_${orderId}`).emit('user_stopped_typing', {
        userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Send welcome message
    socket.emit('connected', {
      message: `Welcome ${socket.userName}! You're connected to real-time updates.`,
      userId,
      socketId: socket.id
    });
  }

  joinOrderTracking(socket, orderId) {
    if (!orderId) return;

    socket.join(`order_${orderId}`);
    
    // Track order room participants
    if (!this.orderRooms.has(orderId)) {
      this.orderRooms.set(orderId, new Set());
    }
    this.orderRooms.get(orderId).add(socket.id);

    logger.info('User joined order tracking', {
      userId: socket.userId,
      orderId,
      socketId: socket.id
    });

    socket.emit('joined_order_tracking', { orderId });
  }

  leaveOrderTracking(socket, orderId) {
    if (!orderId) return;

    socket.leave(`order_${orderId}`);
    
    // Remove from order room tracking
    if (this.orderRooms.has(orderId)) {
      this.orderRooms.get(orderId).delete(socket.id);
      if (this.orderRooms.get(orderId).size === 0) {
        this.orderRooms.delete(orderId);
      }
    }

    socket.emit('left_order_tracking', { orderId });
  }

  updateDeliveryLocation(socket, data) {
    const { orderId, latitude, longitude } = data;
    
    if (socket.userRole !== 'delivery-personnel') {
      return socket.emit('error', { message: 'Unauthorized to update delivery location' });
    }

    // Broadcast location update to order tracking room
    this.io.to(`order_${orderId}`).emit('delivery_location_update', {
      orderId,
      location: { latitude, longitude },
      timestamp: new Date(),
      deliveryPersonnel: {
        id: socket.userId,
        name: socket.userName
      }
    });

    logger.info('Delivery location updated', {
      orderId,
      deliveryPersonnelId: socket.userId,
      location: { latitude, longitude }
    });
  }

  handleDisconnection(socket) {
    const userId = socket.userId;
    
    // Remove from user socket mapping
    this.userSockets.delete(userId);

    // Clean up order room tracking
    for (const [orderId, socketIds] of this.orderRooms.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        this.orderRooms.delete(orderId);
      }
    }

    logger.info('User disconnected from socket', {
      userId,
      socketId: socket.id,
      userName: socket.userName
    });
  }

  // Public methods for emitting events
  
  // Emit order status update to all relevant parties
  emitOrderStatusUpdate(order) {
    const updateData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      timestamp: new Date(),
      statusHistory: order.statusHistory
    };

    // Emit to customer
    this.io.to(`user_${order.customer}`).emit('order_status_update', updateData);

    // Emit to restaurant
    this.io.to(`user_${order.restaurant}`).emit('order_status_update', updateData);

    // Emit to delivery personnel if assigned
    if (order.deliveryPersonnel) {
      this.io.to(`user_${order.deliveryPersonnel}`).emit('order_status_update', updateData);
    }

    // Emit to order tracking room
    this.io.to(`order_${order._id}`).emit('order_status_update', updateData);

    // Emit to admin room
    this.io.to('admin_room').emit('order_status_update', updateData);

    logger.info('Order status update emitted', {
      orderId: order._id,
      status: order.status,
      recipients: ['customer', 'restaurant', 'delivery', 'admin']
    });
  }

  // Emit new order notification to restaurant
  emitNewOrderNotification(order) {
    const notificationData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items,
      total: order.pricing.total,
      estimatedPreparationTime: order.estimatedPreparationTime,
      timestamp: new Date()
    };

    // Notify restaurant
    this.io.to(`user_${order.restaurant}`).emit('new_order', notificationData);

    // Notify admins
    this.io.to('admin_room').emit('new_order', notificationData);

    logger.info('New order notification emitted', {
      orderId: order._id,
      restaurantId: order.restaurant
    });
  }

  // Emit delivery assignment notification
  emitDeliveryAssignment(order) {
    const assignmentData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurant: order.restaurant,
      deliveryAddress: order.deliveryAddress,
      assignedAt: order.deliveryTracking.assignedAt
    };

    // Notify delivery personnel
    this.io.to(`user_${order.deliveryPersonnel}`).emit('delivery_assigned', assignmentData);

    logger.info('Delivery assignment notification emitted', {
      orderId: order._id,
      deliveryPersonnelId: order.deliveryPersonnel
    });
  }

  // Emit order cancellation notification
  emitOrderCancellation(order) {
    const cancellationData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason: order.cancellation.reason,
      cancelledBy: order.cancellation.cancelledBy,
      cancelledAt: order.cancellation.cancelledAt
    };

    // Notify all relevant parties
    this.io.to(`user_${order.customer}`).emit('order_cancelled', cancellationData);
    this.io.to(`user_${order.restaurant}`).emit('order_cancelled', cancellationData);
    
    if (order.deliveryPersonnel) {
      this.io.to(`user_${order.deliveryPersonnel}`).emit('order_cancelled', cancellationData);
    }

    this.io.to(`order_${order._id}`).emit('order_cancelled', cancellationData);
    this.io.to('admin_room').emit('order_cancelled', cancellationData);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  // Get order tracking participants count
  getOrderTrackingCount(orderId) {
    return this.orderRooms.get(orderId)?.size || 0;
  }
}

// Export singleton instance
module.exports = new SocketService();
