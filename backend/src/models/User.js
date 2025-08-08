const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Address subdocument schema
const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      default: "",
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

// Preferences subdocument schema
const preferencesSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      orderUpdates: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

// Main user schema
const userSchema = new mongoose.Schema(
  {
    // Basic fields
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer",
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    // Verification and status
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Profile picture
    profilePicture: {
      publicId: { type: String, default: null },
      url: { type: String, default: null },
      format: { type: String, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      bytes: { type: Number, default: null },
      uploadedAt: { type: Date, default: null },
    },

    // Day 4 additions
    addresses: [addressSchema],
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // Security and tracking
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    deletedAt: { type: Date, default: null }, // Soft delete
  },
  {
    timestamps: true,
  }
);

// Virtuals
userSchema.virtual("fullName").get(function () {
  return `${this.firstName}${this.lastName ? " " + this.lastName : ""}`.trim();
});

userSchema.virtual("accountAge").get(function () {
  const diff = Date.now() - new Date(this.createdAt).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

userSchema.virtual("isLocked").get(function () {
  return this.lockUntil && this.lockUntil > new Date();
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.incLoginAttempts = async function () {
  const maxAttempts = 5;
  const lockTimeMinutes = 15;

  this.loginAttempts += 1;

  if (this.loginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockTimeMinutes * 60000);
  }

  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    deletedAt: null,
  });
};

// Indexes
userSchema.index({ isActive: 1, isVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ deletedAt: 1 });

module.exports = mongoose.model("User", userSchema);
