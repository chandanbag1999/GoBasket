const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    required: [true, 'Please add a product description'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },

  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },

  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  // Restaurant Information
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Restaurant owner
    required: [true, 'Please add restaurant information']
  },

  // Images
  images: [{
    public_id: {
      type: String,
      required: true
    },
    secure_url: {
      type: String,
      required: true
    },
    alt_text: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  // Pricing and Variants
  basePrice: {
    type: Number,
    required: [true, 'Please add base price'],
    min: [0, 'Price cannot be negative']
  },

  variants: [{
    name: {
      type: String,
      required: true,
      trim: true
    }, // e.g., "Small", "Medium", "Large"
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    sku: String,
    isAvailable: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15
    }
  }],

  // Customization Options
  customizations: [{
    name: {
      type: String,
      required: true
    }, // e.g., "Size", "Toppings", "Spice Level"
    type: {
      type: String,
      enum: ['single', 'multiple'],
      required: true
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    options: [{
      name: String,
      price: {
        type: Number,
        default: 0
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],

  // Product Properties
  isVegetarian: {
    type: Boolean,
    default: false
  },

  isVegan: {
    type: Boolean,
    default: false
  },

  containsEgg: {
    type: Boolean,
    default: false
  },

  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'spicy', 'extra_spicy'],
    default: 'mild'
  },

  // Nutritional Information
  nutrition: {
    calories: Number,
    protein: Number,  // in grams
    carbs: Number,    // in grams
    fat: Number,      // in grams
    fiber: Number,    // in grams
    sugar: Number     // in grams
  },

  // Allergen Information
  allergens: [{
    type: String,
    enum: [
      'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 
      'tree_nuts', 'peanuts', 'soy', 'sesame'
    ]
  }],

  // Ingredients
  ingredients: [{
    type: String,
    trim: true
  }],

  // Availability
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },

  availabilitySchedule: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },

  // Preparation and Delivery
  preparationTime: {
    type: Number, // in minutes
    default: 15,
    min: [1, 'Preparation time must be at least 1 minute'],
    max: [180, 'Preparation time cannot exceed 3 hours']
  },

  // Rating and Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },

  // Sales Information
  sales: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    thisMonth: {
      orders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 }
    }
  },

  // SEO and Marketing
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  meta: {
    title: String,
    description: String,
    keywords: [String]
  },

  // Promotions
  offers: [{
    title: String,
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: Number,
    validFrom: Date,
    validTo: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'draft',
    index: true
  },

  // Admin fields
  featured: {
    type: Boolean,
    default: false
  },

  trending: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES for better performance
productSchema.index({ name: 1, status: 1 });
productSchema.index({ restaurant: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: -1, 'rating.average': -1 });
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  shortDescription: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    shortDescription: 5,
    description: 3,
    tags: 2
  }
});

// VIRTUAL FIELDS
productSchema.virtual('defaultImage').get(function() {
  const defaultImg = this.images.find(img => img.isDefault);
  return defaultImg || this.images[0] || null;
});

productSchema.virtual('discountedPrice').get(function() {
  const activeOffer = this.offers.find(offer => 
    offer.isActive && 
    new Date() >= offer.validFrom && 
    new Date() <= offer.validTo
  );
  
  if (activeOffer) {
    if (activeOffer.discountType === 'percentage') {
      return this.basePrice - (this.basePrice * activeOffer.discountValue / 100);
    } else {
      return Math.max(0, this.basePrice - activeOffer.discountValue);
    }
  }
  
  return this.basePrice;
});

productSchema.virtual('isOnOffer').get(function() {
  return this.offers.some(offer => 
    offer.isActive && 
    new Date() >= offer.validFrom && 
    new Date() <= offer.validTo
  );
});

productSchema.virtual('totalVariants').get(function() {
  return this.variants.length;
});

// PRE-SAVE MIDDLEWARE
// Generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Ensure only one default image
  if (this.isModified('images')) {
    let defaultCount = 0;
    this.images.forEach((img, index) => {
      if (img.isDefault) {
        defaultCount++;
        if (defaultCount > 1) {
          img.isDefault = false;
        }
      }
    });
    
    // If no default image, make first one default
    if (defaultCount === 0 && this.images.length > 0) {
      this.images[0].isDefault = true;
    }
  }
  
  next();
});

// STATIC METHODS
// Find products by restaurant
productSchema.statics.findByRestaurant = function(restaurantId, status = 'active') {
  return this.find({ restaurant: restaurantId, status })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort({ featured: -1, 'rating.average': -1 });
};

// Search products
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    isAvailable: true,
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('category', 'name slug')
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 });
};

// Get featured products
productSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    featured: true, 
    isAvailable: true 
  })
    .populate('category', 'name slug')
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(limit);
};

// Get trending products
productSchema.statics.getTrending = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    trending: true, 
    isAvailable: true 
  })
    .populate('category', 'name slug')
    .populate('restaurant', 'name restaurantProfile.restaurantName')
    .sort({ 'sales.thisMonth.orders': -1, 'rating.average': -1 })
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
