const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const productImageSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String },
    sortOrder: { type: Number, default: 0 },
    isMain: { type: Boolean, default: false },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },

    // Pricing (for simple products)
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },

    // Inventory
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },

    // Physical attributes
    weight: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "l", "ml", "pcs", "pack", "box", "dozen"],
      default: "pcs",
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },

    // Images
    images: [productImageSchema],

    // Product variants (for variable products)
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: [productVariantSchema],

    // Status and flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOnSale: {
      type: Boolean,
      default: false,
      index: true,
    },

    // SEO and metadata
    metadata: {
      seo: {
        title: String,
        description: String,
        keywords: [String],
      },
      attributes: [
        {
          name: String,
          value: String,
        },
      ],
      tags: [String],
      barcode: String,
      expiryDate: Date,
    },

    // Ratings and reviews
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 },
      },
    },

    // Sales metrics
    salesMetrics: {
      totalSold: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      wishlisted: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
productSchema.virtual("isInStock").get(function () {
  if (this.hasVariants) {
    return this.variants.some(
      (variant) => variant.stock > 0 && variant.isActive
    );
  }
  return this.stock > 0;
});

productSchema.virtual("isLowStock").get(function () {
  if (this.hasVariants) {
    return this.variants.some(
      (variant) => variant.stock <= this.lowStockThreshold && variant.stock > 0
    );
  }
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

productSchema.virtual("discountPercentage").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(
      ((this.comparePrice - this.price) / this.comparePrice) * 100
    );
  }
  return 0;
});

productSchema.virtual("mainImage").get(function () {
  const mainImg = this.images.find((img) => img.isMain);
  return mainImg || this.images[0] || null;
});

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

// Instance methods
productSchema.methods.updateStock = function (
  quantity,
  operation = "subtract"
) {
  if (!this.trackInventory) return this;

  if (this.hasVariants) {
    console.warn("Use updateVariantStock for products with variants");
    return this;
  }

  if (operation === "subtract") {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === "add") {
    this.stock += quantity;
  }

  return this;
};

productSchema.methods.updateVariantStock = function (
  variantId,
  quantity,
  operation = "subtract"
) {
  const variant = this.variants.id(variantId);
  if (!variant) throw new Error("Variant not found");

  if (operation === "subtract") {
    variant.stock = Math.max(0, variant.stock - quantity);
  } else if (operation === "add") {
    variant.stock += quantity;
  }

  return this;
};

productSchema.methods.updateRating = function (newRating, oldRating = null) {
  if (oldRating) {
    // Remove old rating
    this.ratings.distribution[this.getRatingKey(oldRating)]--;
    this.ratings.count--;
  }

  // Add new rating
  this.ratings.distribution[this.getRatingKey(newRating)]++;
  this.ratings.count++;

  // Recalculate average
  const total =
    this.ratings.distribution.five * 5 +
    this.ratings.distribution.four * 4 +
    this.ratings.distribution.three * 3 +
    this.ratings.distribution.two * 2 +
    this.ratings.distribution.one * 1;

  this.ratings.average =
    this.ratings.count > 0 ? total / this.ratings.count : 0;

  return this;
};

productSchema.methods.getRatingKey = function (rating) {
  const keys = { 5: "five", 4: "four", 3: "three", 2: "two", 1: "one" };
  return keys[rating] || "one";
};

// Static methods
productSchema.statics.findActiveProducts = function (options = {}) {
  const {
    category,
    inStock = false,
    featured = false,
    onSale = false,
    limit = 20,
    skip = 0,
    sort = { createdAt: -1 },
  } = options;

  const query = { isActive: true };

  if (category) query.category = category;
  if (inStock) query.stock = { $gt: 0 };
  if (featured) query.isFeatured = true;
  if (onSale) query.isOnSale = true;

  return this.find(query)
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

productSchema.statics.searchProducts = function (searchTerm, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    inStock = false,
    limit = 20,
    skip = 0,
  } = options;

  const query = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
      { brand: { $regex: searchTerm, $options: "i" } },
      { "metadata.tags": { $regex: searchTerm, $options: "i" } },
    ],
  };

  if (category) query.category = category;
  if (minPrice !== undefined) query.price = { $gte: minPrice };
  if (maxPrice !== undefined) query.price = { ...query.price, $lte: maxPrice };
  if (inStock) query.stock = { $gt: 0 };

  return this.find(query)
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

productSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true })
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .populate("reviews");
};

productSchema.statics.getProductStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
        lowStock: {
          $sum: { $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0] },
        },
        averagePrice: { $avg: "$price" },
        totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
      },
    },
  ]);
};

// Pre-save middleware
productSchema.pre("save", function (next) {
  // Generate slug if not exists
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  // Set isOnSale flag
  this.isOnSale = this.comparePrice && this.comparePrice > this.price;

  // Ensure at least one image is marked as main
  if (this.images.length > 0 && !this.images.some((img) => img.isMain)) {
    this.images[0].isMain = true;
  }

  next();
});

// Indexes
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  "metadata.tags": "text",
});
productSchema.index({ category: 1, isActive: 1, isFeatured: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ stock: 1, isActive: 1 });
productSchema.index({ "ratings.average": -1, "ratings.count": -1 });
productSchema.index({ createdAt: -1 });


module.exports = mongoose.model("Product", productSchema);
