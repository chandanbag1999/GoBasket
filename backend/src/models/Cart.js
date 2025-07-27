const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Product details snapshot (in case product changes)
  productSnapshot: {
    name: String,
    basePrice: Number,
    image: String,
    isAvailable: Boolean
  },
  
  // Selected variant (Small/Medium/Large)
  selectedVariant: {
    name: String,
    price: Number,
    preparationTime: Number
  },
  
  // Selected customizations
  customizations: [{
    customizationId: String,
    name: String, // e.g., "Extra Toppings"
    selectedOptions: [{
      optionId: String,
      name: String, // e.g., "Extra Cheese"
      price: Number
    }]
  }],
  
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum 10 items allowed per product']
  },
  
  // Calculated prices
  unitPrice: {
    type: Number,
    required: true
  },
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  // Special instructions
  specialInstructions: {
    type: String,
    maxlength: [200, 'Special instructions cannot exceed 200 characters']
  }
  
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Restaurant owner
    required: true
  },
  
  items: [cartItemSchema],
  
  // Cart totals
  subtotal: {
    type: Number,
    default: 0
  },
  
  // Taxes and fees
  taxes: {
    gst: {
      type: Number,
      default: 0
    },
    serviceCharge: {
      type: Number,
      default: 0
    }
  },
  
  // Delivery details
  deliveryFee: {
    type: Number,
    default: 0
  },
  
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses'
  },
  
  // Final total
  total: {
    type: Number,
    default: 0
  },
  
  // Cart status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active',
    index: true
  },
  
  // Expiry (carts expire after 24 hours of inactivity)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ restaurant: 1, status: 1 });
cartSchema.index({ createdAt: -1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// VIRTUAL FIELDS
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('estimatedPreparationTime').get(function() {
  if (this.items.length === 0) return 0;
  
  // Take maximum preparation time among all items
  return Math.max(...this.items.map(item => {
    const variantTime = item.selectedVariant?.preparationTime || 0;
    return variantTime;
  }));
});

// PRE-SAVE MIDDLEWARE
cartSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
  
  // Calculate taxes (GST 5% for food)
  this.taxes.gst = Math.round(this.subtotal * 0.05);
  
  // Service charge (2% of subtotal)
  this.taxes.serviceCharge = Math.round(this.subtotal * 0.02);
  
  // Calculate delivery fee based on subtotal
  if (this.subtotal >= 500) {
    this.deliveryFee = 0; // Free delivery above ₹500
  } else if (this.subtotal >= 200) {
    this.deliveryFee = 30; // ₹30 delivery fee
  } else {
    this.deliveryFee = 50; // ₹50 delivery fee for small orders
  }
  
  // Calculate final total
  this.total = this.subtotal + this.taxes.gst + this.taxes.serviceCharge + this.deliveryFee;
  
  // Update expiry on activity
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  next();
});

// INSTANCE METHODS
cartSchema.methods.calculateItemPrice = function(item) {
  let unitPrice = item.selectedVariant?.price || 0;
  
  // Add customization prices
  item.customizations.forEach(customization => {
    customization.selectedOptions.forEach(option => {
      unitPrice += option.price;
    });
  });
  
  const totalPrice = unitPrice * item.quantity;
  
  return { unitPrice, totalPrice };
};

cartSchema.methods.addItem = function(itemData) {
  const { unitPrice, totalPrice } = this.calculateItemPrice(itemData);

  // Check if same item already exists
  const existingItemIndex = this.items.findIndex(item =>
    item.product.toString() === itemData.product.toString() &&
    JSON.stringify(item.selectedVariant) === JSON.stringify(itemData.selectedVariant) &&
    JSON.stringify(item.customizations) === JSON.stringify(itemData.customizations)
  );

  if (existingItemIndex !== -1) {
    // Update existing item quantity
    const newQuantity = this.items[existingItemIndex].quantity + itemData.quantity;

    // Validate quantity limits
    if (newQuantity > 10) {
      throw new Error(`Cannot add ${itemData.quantity} items. Maximum 10 items allowed per product variant. Current quantity: ${this.items[existingItemIndex].quantity}`);
    }

    this.items[existingItemIndex].quantity = newQuantity;
    const updatedPrices = this.calculateItemPrice(this.items[existingItemIndex]);
    this.items[existingItemIndex].unitPrice = updatedPrices.unitPrice;
    this.items[existingItemIndex].totalPrice = updatedPrices.totalPrice;
  } else {
    // Validate quantity for new item
    if (itemData.quantity > 10) {
      throw new Error(`Cannot add ${itemData.quantity} items. Maximum 10 items allowed per product variant.`);
    }

    // Add new item
    this.items.push({
      ...itemData,
      unitPrice,
      totalPrice
    });
  }

  return this.save();
};

cartSchema.methods.updateItem = function(itemId, updates) {
  const item = this.items.id(itemId);
  if (!item) throw new Error('Item not found in cart');
  
  // Update item properties
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      item[key] = updates[key];
    }
  });
  
  // Recalculate prices
  const { unitPrice, totalPrice } = this.calculateItemPrice(item);
  item.unitPrice = unitPrice;
  item.totalPrice = totalPrice;
  
  return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
  this.items.pull(itemId);
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// STATIC METHODS
cartSchema.statics.findActiveCart = function(userId, restaurantId) {
  return this.findOne({
    user: userId,
    restaurant: restaurantId,
    status: 'active'
  }).populate('items.product', 'name images isAvailable');
};

cartSchema.statics.cleanupExpiredCarts = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: 'active'
  });
};

module.exports = mongoose.model('Cart', cartSchema);
