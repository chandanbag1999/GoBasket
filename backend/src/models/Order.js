const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Product snapshot at time of order
  productSnapshot: {
    name: { type: String, required: true },
    description: String,
    basePrice: { type: Number, required: true },
    image: String,
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    restaurantName: String
  },
  
  selectedVariant: {
    name: String,
    price: Number,
    preparationTime: Number
  },
  
  customizations: [{
    name: String,
    selectedOptions: [{
      name: String,
      price: Number
    }]
  }],
  
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  
  unitPrice: {
    type: Number,
    required: true
  },
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  specialInstructions: String
});

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  
  // Customer information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Restaurant information
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Delivery information
  deliveryAddress: {
    title: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactPhone: String
  },
  
  // Pricing breakdown
  pricing: {
    subtotal: { type: Number, required: true },
    taxes: {
      gst: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 }
    },
    deliveryFee: { type: Number, default: 0 },
    discount: {
      amount: { type: Number, default: 0 },
      couponCode: String,
      description: String
    },
    total: { type: Number, required: true }
  },
  
  // Order status and timeline
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, awaiting restaurant confirmation
      'confirmed',         // Restaurant confirmed order
      'preparing',         // Food is being prepared
      'ready',            // Food ready for pickup by delivery personnel
      'picked_up',        // Delivery personnel picked up the order
      'out_for_delivery', // Order is on the way to customer
      'delivered',        // Order delivered successfully
      'cancelled',        // Order cancelled
      'refunded'          // Order refunded
    ],
    default: 'pending',
    index: true
  },
  
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    notes: String
  }],
  
  // Timing information
  estimatedPreparationTime: {
    type: Number, // in minutes
    required: true
  },
  
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  
  actualDeliveryTime: Date,
  
  // Delivery assignment
  deliveryPersonnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  deliveryTracking: {
    assignedAt: Date,
    pickedUpAt: Date,
    currentLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date
    },
    deliveredAt: Date
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash_on_delivery', 'online', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentGateway: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  
  // Customer feedback
  rating: {
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 500
    },
    reviewDate: Date
  },
  
  // Order metadata
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  
  // Cancellation information
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'processed'],
      default: 'not_applicable'
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ deliveryPersonnel: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'deliveryAddress.pincode': 1 });

// VIRTUAL FIELDS
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual('currentStatus').get(function() {
  return this.statusHistory[this.statusHistory.length - 1];
});

orderSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered';
});

orderSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

orderSchema.virtual('timeElapsed').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// PRE-SAVE MIDDLEWARE
// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `QC${dateStr}${randomNum}`;
  }
  next();
});

// Add status change to history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// INSTANCE METHODS
orderSchema.methods.updateStatus = function(newStatus, updatedBy, reason, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    reason,
    notes
  });
  
  // Update specific timestamps
  if (newStatus === 'picked_up') {
    this.deliveryTracking.pickedUpAt = new Date();
  } else if (newStatus === 'delivered') {
    this.deliveryTracking.deliveredAt = new Date();
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

orderSchema.methods.assignDeliveryPersonnel = function(deliveryPersonId) {
  this.deliveryPersonnel = deliveryPersonId;
  this.deliveryTracking.assignedAt = new Date();
  return this.save();
};

orderSchema.methods.updateDeliveryLocation = function(latitude, longitude) {
  this.deliveryTracking.currentLocation = {
    latitude,
    longitude,
    updatedAt: new Date()
  };
  return this.save();
};

orderSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date(),
    refundStatus: this.payment.status === 'completed' ? 'pending' : 'not_applicable'
  };
  
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    updatedBy: cancelledBy,
    reason
  });
  
  return this.save();
};

orderSchema.methods.addRating = function(ratingData) {
  this.rating = {
    ...ratingData,
    reviewDate: new Date()
  };
  return this.save();
};

// STATIC METHODS
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber })
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name restaurantProfile')
    .populate('deliveryPersonnel', 'name phone deliveryProfile');
};

orderSchema.statics.getOrdersByStatus = function(status, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.find({ status })
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

orderSchema.statics.getCustomerOrders = function(customerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ customer: customerId })
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

orderSchema.statics.getRestaurantOrders = function(restaurantId, status = null, page = 1, limit = 20) {
  const query = { restaurant: restaurantId };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  return this.find(query)
    .populate('customer', 'name phone')
    .populate('deliveryPersonnel', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

orderSchema.statics.getDeliveryPersonnelOrders = function(deliveryPersonnelId, status = null) {
  const query = { deliveryPersonnel: deliveryPersonnelId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('customer', 'name phone')
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ createdAt: -1 });
};

// Order analytics
orderSchema.statics.getOrderStats = function(restaurantId, startDate, endDate) {
  const matchQuery = {
    restaurant: restaurantId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
