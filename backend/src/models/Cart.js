const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    price: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    lastModified: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual("totalAmount").get(function () {
  return this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

// Instance methods
cartSchema.methods.addItem = function (productId, quantity, price) {
  const existingItem = this.items.find(
    (item) => item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update with latest price
  } else {
    this.items.push({ productId, quantity, price });
  }

  this.lastModified = new Date();
  return this;
};

cartSchema.methods.updateItem = function (productId, quantity) {
  const item = this.items.find(
    (item) => item.productId.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(
        (item) => item.productId.toString() !== productId.toString()
      );
    } else {
      item.quantity = quantity;
    }
    this.lastModified = new Date();
  }

  return this;
};

cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  this.lastModified = new Date();
  return this;
};

cartSchema.methods.clear = function () {
  this.items = [];
  this.lastModified = new Date();
  return this;
};

// Static methods
cartSchema.statics.findByUser = function (userId) {
  return this.findOne({ userId }).populate(
    "items.productId",
    "name images price stock category unit"
  );
};

// Middleware
cartSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
