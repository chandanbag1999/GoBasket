const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [wishlistItemSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: "My Wishlist",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
wishlistSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

// Instance methods
wishlistSchema.methods.addItem = function (productId, notes = "") {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (!existingItem) {
    this.items.push({ product: productId, notes });
  }

  return this;
};

wishlistSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this;
};

wishlistSchema.methods.hasItem = function (productId) {
  return this.items.some(
    (item) => item.product.toString() === productId.toString()
  );
};

// Static methods
wishlistSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug price comparePrice images stock isActive",
    match: { isActive: true },
  });
};

module.exports = mongoose.model("Wishlist", wishlistSchema);
