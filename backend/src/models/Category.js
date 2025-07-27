const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    unique: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    index: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },

  image: {
    public_id: String,    // Cloudinary public ID
    secure_url: String    // Cloudinary URL
  },

  // Category hierarchy
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },

  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // Display and ordering
  displayOrder: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  // SEO and metadata
  meta: {
    title: String,
    description: String,
    keywords: [String]
  },

  // Category specific properties
  cuisine: {
    type: String,
    enum: [
      'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese',
      'American', 'Continental', 'Fast Food', 'Desserts', 'Beverages',
      'South Indian', 'North Indian', 'Street Food', 'Healthy', 'Bakery'
    ]
  },

  // Category tags for filtering
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Statistics
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalRestaurants: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES
categorySchema.index({ name: 1, isActive: 1 });
// Note: slug index is automatically created by unique: true
categorySchema.index({ cuisine: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1, createdAt: -1 });
categorySchema.index({ parentCategory: 1 });

// VIRTUAL FIELDS
categorySchema.virtual('level').get(function() {
  return this.parentCategory ? 1 : 0; // 0 = parent, 1 = child
});

categorySchema.virtual('fullPath').get(function() {
  if (this.parentCategory && this.populated('parentCategory')) {
    return `${this.parentCategory.name} > ${this.name}`;
  }
  return this.name;
});

// PRE-SAVE MIDDLEWARE
// Generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .trim();
  }
  next();
});

// POST-SAVE MIDDLEWARE
// Update parent category's subcategories array
categorySchema.post('save', async function(doc) {
  if (doc.parentCategory) {
    await mongoose.model('Category').findByIdAndUpdate(
      doc.parentCategory,
      { $addToSet: { subcategories: doc._id } }
    );
  }
});

// STATIC METHODS
// Get category hierarchy
categorySchema.statics.getHierarchy = function() {
  return this.find({ parentCategory: null, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { displayOrder: 1, name: 1 } }
    })
    .sort({ displayOrder: 1, name: 1 });
};

// Search categories
categorySchema.statics.searchCategories = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } }
    ]
  }).sort({ displayOrder: 1, name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
