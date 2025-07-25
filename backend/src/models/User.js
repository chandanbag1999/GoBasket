const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot be more than 50 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces']
  },
  
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please add a valid email'
    ],
    index: true  // Database index for faster queries
  },
  
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please add a valid phone number'],
    index: true
  },
  
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Don't return password in queries by default
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: {
      values: ['customer', 'restaurant-owner', 'delivery-personnel', 'sub-admin', 'admin'],
      message: 'Invalid role specified'
    },
    default: 'customer',
    index: true
  },
  
  // Profile Information
  avatar: {
    public_id: String,    // Cloudinary public ID
    secure_url: String    // Cloudinary URL
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        // Must be at least 13 years old
        const thirteenYearsAgo = new Date();
        thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
        return date <= thirteenYearsAgo;
      },
      message: 'Must be at least 13 years old'
    }
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  
  // Address Management
  addresses: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [30, 'Address title cannot exceed 30 characters']
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Address line 1 cannot exceed 100 characters']
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [100, 'Address line 2 cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      required: true,
      match: [/^[1-9][0-9]{5}$/, 'Invalid pincode format']
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Invalid latitude'],
        max: [90, 'Invalid latitude']
      },
      longitude: {
        type: Number,
        min: [-180, 'Invalid longitude'],
        max: [180, 'Invalid longitude']
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Role-specific Profiles
  customerProfile: {
    favoriteRestaurants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    }],
    orderHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    preferences: {
      cuisine: [String],
      dietaryRestrictions: [String],
      spiceLevel: {
        type: String,
        enum: ['mild', 'medium', 'spicy', 'extra-spicy']
      }
    }
  },
  
  restaurantProfile: {
    restaurantName: {
      type: String,
      trim: true,
      maxlength: [100, 'Restaurant name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    cuisine: [{
      type: String,
      enum: [
        'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese',
        'American', 'Continental', 'Fast Food', 'Desserts', 'Beverages'
      ]
    }],
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDocuments: [{
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    businessLicense: String,
    fssaiLicense: String
  },
  
  deliveryProfile: {
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'bicycle', 'car', 'on-foot']
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    deliveryZones: [{
      type: String,  // Pincode or area name
      trim: true
    }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    earnings: {
      total: { type: Number, default: 0, min: 0 },
      thisMonth: { type: Number, default: 0, min: 0 },
      lastPayout: Date
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Security and Activity
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginAttempts: {
    count: { type: Number, default: 0 },
    lastAttempt: Date,
    lockedUntil: Date
  },
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpire: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Phone Verification
  phoneVerificationOTP: String,
  phoneVerificationExpire: Date,
  
  // Device Management
  devices: [{
    deviceId: String,
    deviceType: String,  // 'mobile', 'web', 'tablet'
    lastUsed: Date,
    pushToken: String,   // For notifications
    isActive: { type: Boolean, default: true }
  }],
  
  // Notifications Preferences
  notifications: {
    email: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    },
    push: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      deliveryUpdates: { type: Boolean, default: true }
    },
    sms: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    }
  }
  
}, {
  timestamps: true,  // Adds createdAt and updatedAt automatically
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      delete ret.phoneVerificationOTP;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// INDEXES for better performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ phone: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'addresses.coordinates': '2dsphere' }); // For geo queries

// VIRTUAL FIELDS
userSchema.virtual('fullProfile').get(function() {
  const profile = {
    basic: {
      id: this._id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      avatar: this.avatar
    }
  };
  
  // Add role-specific profile
  if (this.role === 'customer' && this.customerProfile) {
    profile.customer = this.customerProfile;
  } else if (this.role === 'restaurant-owner' && this.restaurantProfile) {
    profile.restaurant = this.restaurantProfile;
  } else if (this.role === 'delivery-personnel' && this.deliveryProfile) {
    profile.delivery = this.deliveryProfile;
  }
  
  return profile;
});

// PRE-SAVE MIDDLEWARE
// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Ensure only one default address per user
userSchema.pre('save', function(next) {
  if (this.isModified('addresses')) {
    let defaultCount = 0;
    this.addresses.forEach(address => {
      if (address.isDefault) defaultCount++;
    });
    
    // If multiple defaults, keep only the last one
    if (defaultCount > 1) {
      this.addresses.forEach((address, index) => {
        if (index < this.addresses.length - 1) {
          address.isDefault = false;
        }
      });
    }
  }
  next();
});


// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      email: this.email
    }, 
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
      issuer: 'quick-commerce-api',
      audience: 'quick-commerce-app'
    }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (10 minutes)
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Generate phone verification OTP
userSchema.methods.generatePhoneOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  
  this.phoneVerificationOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  this.phoneVerificationExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  return otp;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'loginAttempts.lockedUntil': 1 },
      $set: {
        'loginAttempts.count': 1,
        'loginAttempts.lastAttempt': Date.now()
      }
    });
  }
  
  const updates = {
    $inc: { 'loginAttempts.count': 1 },
    $set: { 'loginAttempts.lastAttempt': Date.now() }
  };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts.count + 1 >= 5 && !this.loginAttempts.lockedUntil) {
    updates.$set['loginAttempts.lockedUntil'] = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'loginAttempts.count': 1,
      'loginAttempts.lastAttempt': 1,
      'loginAttempts.lockedUntil': 1
    }
  });
};


// Find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Search users
userSchema.statics.searchUsers = function(query, role = null) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    isActive: true,
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ]
  };
  
  if (role) {
    searchQuery.role = role;
  }
  
  return this.find(searchQuery).select('-password');
};

module.exports = mongoose.model('User', userSchema);
