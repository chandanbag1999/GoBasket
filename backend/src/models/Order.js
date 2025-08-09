const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "pcs" },
    subtotal: { type: Number, required: true },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const paymentInfoSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["razorpay", "cod", "wallet"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date },
    failureReason: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Order Items
    items: [orderItemSchema],

    // Pricing
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    // Address
    shippingAddress: { type: shippingAddressSchema, required: true },

    // Payment
    payment: { type: paymentInfoSchema, required: true },

    // Tracking
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    // Notes
    customerNotes: { type: String, maxlength: 500 },
    internalNotes: { type: String, maxlength: 500 },

    // Metadata
    source: {
      type: String,
      enum: ["web", "mobile", "admin"],
      default: "web",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.virtual("statusHistory").get(function () {
  return {
    pending: this.createdAt,
    confirmed: this.status === "confirmed" ? this.updatedAt : null,
    delivered: this.deliveredAt,
    cancelled: this.cancelledAt,
  };
});

// Instance methods
orderSchema.methods.calculateTotal = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalAmount =
    this.subtotal + this.tax + this.deliveryFee - this.discount;
  return this.totalAmount;
};

orderSchema.methods.canCancel = function () {
  return ["pending", "confirmed"].includes(this.status);
};

orderSchema.methods.canRefund = function () {
  return this.status === "delivered" && this.payment.status === "completed";
};

// Static methods
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `GRO${timestamp.slice(-8)}${random}`;
};

orderSchema.statics.findByUser = function (userId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  const query = { userId };

  if (status) query.status = status;

  return this.find(query)
    .populate("items.productId", "name images category")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.status": 1 });


module.exports = mongoose.model("Order", orderSchema);
