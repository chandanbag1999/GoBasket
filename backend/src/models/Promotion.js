const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    // Promotion type and configuration
    type: {
      type: String,
      enum: ["percentage", "fixed_amount", "free_shipping", "bogo", "combo"],
      required: true,
    },

    // Discount configuration
    discount: {
      value: { type: Number, required: true },
      maxDiscount: { type: Number }, // For percentage discounts
      minOrderAmount: { type: Number, default: 0 },
    },

    // Usage limits
    usageLimit: {
      total: { type: Number }, // Total times this promotion can be used
      perUser: { type: Number, default: 1 }, // Times per user
      currentUsage: { type: Number, default: 0 },
    },

    // Validity period
    validity: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      isActive: { type: Boolean, default: true },
    },

    // Target criteria
    applicableTo: {
      userType: {
        type: String,
        enum: ["all", "new", "returning", "vip"],
        default: "all",
      },
      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      cities: [String],
      minPurchaseHistory: Number, // Minimum previous orders
    },

    // BOGO and combo specific
    buyGetOffer: {
      buyQuantity: Number,
      getQuantity: Number,
      applicableProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    },

    // Analytics tracking
    analytics: {
      totalUses: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalSavings: { type: Number, default: 0 },
      uniqueUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // Administrative
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "expired", "disabled"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
promotionSchema.virtual("isExpired").get(function () {
  return new Date() > this.validity.endDate;
});

promotionSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.validity.isActive &&
    now >= this.validity.startDate &&
    now <= this.validity.endDate &&
    this.status === "active"
  );
});

promotionSchema.virtual("remainingUses").get(function () {
  if (!this.usageLimit.total) return null;
  return Math.max(0, this.usageLimit.total - this.usageLimit.currentUsage);
});

// Instance methods
promotionSchema.methods.canBeUsedBy = function (
  userId,
  orderAmount,
  userType = "returning"
) {
  // Check if promotion is valid
  if (!this.isValid)
    return { valid: false, reason: "Promotion is not active or expired" };

  // Check usage limits
  if (
    this.usageLimit.total &&
    this.usageLimit.currentUsage >= this.usageLimit.total
  ) {
    return { valid: false, reason: "Promotion usage limit exceeded" };
  }

  // Check per user limit
  const userUsageCount = this.analytics.uniqueUsers.filter(
    (id) => id.toString() === userId.toString()
  ).length;

  if (userUsageCount >= this.usageLimit.perUser) {
    return { valid: false, reason: "User usage limit exceeded" };
  }

  // Check minimum order amount
  if (orderAmount < this.discount.minOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount is ₹${this.discount.minOrderAmount}`,
    };
  }

  // Check user type
  if (
    this.applicableTo.userType !== "all" &&
    this.applicableTo.userType !== userType
  ) {
    return { valid: false, reason: "Not applicable for your user type" };
  }

  return { valid: true };
};

promotionSchema.methods.calculateDiscount = function (orderAmount, items = []) {
  let discount = 0;

  switch (this.type) {
    case "percentage":
      discount = (orderAmount * this.discount.value) / 100;
      if (this.discount.maxDiscount) {
        discount = Math.min(discount, this.discount.maxDiscount);
      }
      break;

    case "fixed_amount":
      discount = Math.min(this.discount.value, orderAmount);
      break;

    case "free_shipping":
      discount = 0; // Handled separately in shipping calculation
      break;

    case "bogo":
      // Buy X Get Y logic
      if (this.buyGetOffer && items.length > 0) {
        const eligibleItems = items.filter(
          (item) =>
            this.buyGetOffer.applicableProducts.includes(item.productId) ||
            this.buyGetOffer.applicableProducts.length === 0
        );

        const totalEligibleQty = eligibleItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const freeQty =
          Math.floor(totalEligibleQty / this.buyGetOffer.buyQuantity) *
          this.buyGetOffer.getQuantity;

        // Calculate discount based on cheapest items being free
        const sortedItems = eligibleItems.sort((a, b) => a.price - b.price);
        let remainingFreeQty = freeQty;

        for (const item of sortedItems) {
          if (remainingFreeQty <= 0) break;
          const freeFromThisItem = Math.min(item.quantity, remainingFreeQty);
          discount += freeFromThisItem * item.price;
          remainingFreeQty -= freeFromThisItem;
        }
      }
      break;
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

promotionSchema.methods.recordUsage = function (
  userId,
  orderAmount,
  discountApplied
) {
  this.usageLimit.currentUsage += 1;
  this.analytics.totalUses += 1;
  this.analytics.totalSavings += discountApplied;

  if (!this.analytics.uniqueUsers.includes(userId)) {
    this.analytics.uniqueUsers.push(userId);
  }

  return this;
};

// Static methods
promotionSchema.statics.findValidPromotions = function (
  userType = "all",
  categories = [],
  location = null
) {
  const now = new Date();

  return this.find({
    status: "active",
    "validity.isActive": true,
    "validity.startDate": { $lte: now },
    "validity.endDate": { $gte: now },
    $or: [
      { "usageLimit.total": { $exists: false } },
      { $expr: { $lt: ["$usageLimit.currentUsage", "$usageLimit.total"] } },
    ],
    $or: [
      { "applicableTo.userType": "all" },
      { "applicableTo.userType": userType },
    ],
  }).populate("applicableTo.categories applicableTo.products");
};

promotionSchema.statics.findByCode = function (code) {
  return this.findOne({
    code: code.toUpperCase(),
    status: "active",
  });
};

// Indexes
promotionSchema.index({ status: 1, "validity.startDate": 1 });
promotionSchema.index({ "validity.endDate": 1 });
promotionSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);
