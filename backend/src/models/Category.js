const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
      trim: true,
      maxlength: 500,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    level: {
      type: Number,
      default: 0,
      index: true,
    },
    image: {
      publicId: { type: String },
      url: { type: String },
      alt: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    metadata: {
      seo: {
        title: String,
        description: String,
        keywords: [String],
      },
      attributes: [
        {
          name: String,
          values: [String],
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Instance methods
categorySchema.methods.getFullPath = async function () {
  const path = [this.name];
  let current = this;

  while (current.parentCategory) {
    current = await this.constructor.findById(current.parentCategory);
    if (current) path.unshift(current.name);
  }

  return path.join(" > ");
};

// Static methods
categorySchema.statics.findActiveCategories = function (level = null) {
  const query = { isActive: true };
  if (level !== null) query.level = level;

  return this.find(query)
    .populate("parentCategory", "name slug")
    .sort({ level: 1, sortOrder: 1, name: 1 });
};

categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true })
    .populate("parentCategory", "name slug")
    .populate("subcategories", "name slug image sortOrder");
};

// Pre-save middleware
categorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
  next();
});

// Indexes
categorySchema.index({ parentCategory: 1, sortOrder: 1 });
categorySchema.index({ isActive: 1, level: 1 });
categorySchema.index({
  "metadata.seo.keywords": "text",
  name: "text",
  description: "text",
});

module.exports = mongoose.model("Category", categorySchema);
