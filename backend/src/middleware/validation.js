const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation errors
    logger.warn('Validation failed', {
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      errors: errors.array(),
      body: req.body
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  objectId: /^[0-9a-fA-F]{24}$/,
  pincode: /^[1-9][0-9]{5}$/,
  coordinates: /^-?([1-8]?[0-9]\.{1}\d{1,6}$|90\.{1}0{1,6}$)/
};

// Validation rules for different endpoints
const validationRules = {
  // User registration validation
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
      .isLength({ max: 100 })
      .withMessage('Email cannot exceed 100 characters'),
    
    body('phone')
      .matches(patterns.phone)
      .withMessage('Please provide a valid phone number')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10-15 digits'),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(patterns.password)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('role')
      .optional()
      .isIn(['customer', 'restaurant-owner', 'delivery-personnel'])
      .withMessage('Invalid role specified'),
    
    handleValidationErrors
  ],
  
  // User login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1, max: 128 })
      .withMessage('Password cannot exceed 128 characters'),
    
    handleValidationErrors
  ],
  
  // Password reset validation
  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    handleValidationErrors
  ],
  
  // Reset password validation
  resetPassword: [
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(patterns.password)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    
    param('token')
      .isLength({ min: 10 })
      .withMessage('Invalid reset token'),
    
    handleValidationErrors
  ],
  
  // Profile update validation
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('phone')
      .optional()
      .matches(patterns.phone)
      .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
  ],
  
  // Address validation
  addAddress: [
    body('title')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Address title must be between 2 and 30 characters'),

    body('addressLine1')
      .trim()
      .isLength({ min: 10, max: 100 })
      .withMessage('Address line 1 must be between 10 and 100 characters'),

    body('addressLine2')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Address line 2 cannot exceed 100 characters'),

    body('city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('City can only contain letters and spaces'),

    body('state')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('State must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('State can only contain letters and spaces'),

    body('pincode')
      .matches(patterns.pincode)
      .withMessage('Please provide a valid 6-digit pincode'),

    body('coordinates.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),

    body('coordinates.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),

    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean value'),

    handleValidationErrors
  ],
  
  // ObjectId parameter validation
  objectIdParam: [
    param('id')
      .matches(patterns.objectId)
      .withMessage('Invalid ID format'),

    handleValidationErrors
  ],

  // Address ID parameter validation
  addressIdParam: [
    param('addressId')
      .matches(patterns.objectId)
      .withMessage('Invalid address ID format'),

    handleValidationErrors
  ],
  
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer between 1 and 1000'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc', '1', '-1'])
      .withMessage('Sort must be asc, desc, 1, or -1'),
    
    handleValidationErrors
  ],

  // Password change validation
  changePassword: [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
    handleValidationErrors
  ],

  // OTP verification validation
  verifyOTP: [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
    handleValidationErrors
  ],

  // Address update validation
  updateAddress: [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Address title must be between 2 and 30 characters'),
  
  body('addressLine1')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Address line 1 must be between 10 and 100 characters'),
  
  body('addressLine2')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Address line 2 cannot exceed 100 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),
  
  body('pincode')
    .optional()
    .matches(patterns.pincode)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
    handleValidationErrors
  ],

  // Category validation
  createCategory: [
    body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Category name contains invalid characters'),
  
    body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
    body('parentCategory')
    .optional()
    .matches(patterns.objectId)
    .withMessage('Invalid parent category ID'),
  
    body('cuisine')
    .optional()
    .isIn(['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'American', 'Continental', 'Fast Food', 'Desserts', 'Beverages'])
    .withMessage('Invalid cuisine type'),
  
    handleValidationErrors
  ],

  // Product validation
  createProduct: [
    body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
    body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
    body('category')
    .matches(patterns.objectId)
    .withMessage('Invalid category ID'),
  
    body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
    body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Preparation time must be between 1 and 180 minutes'),
  
    body('spiceLevel')
    .optional()
    .isIn(['mild', 'medium', 'spicy', 'extra_spicy'])
    .withMessage('Invalid spice level'),
  
    handleValidationErrors
  ],

  // Cart validation
  addToCart: [
    body('productId')
      .matches(patterns.objectId)
      .withMessage('Invalid product ID'),

    body('quantity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Quantity must be between 1 and 10'),

    body('selectedVariant.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Variant name must be between 1 and 50 characters'),

    body('selectedVariant.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Variant price must be a positive number'),

    body('customizations')
      .optional()
      .isArray()
      .withMessage('Customizations must be an array'),

    body('customizations.*.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Customization name must be between 1 and 100 characters'),

    body('customizations.*.selectedOptions')
      .optional()
      .isArray()
      .withMessage('Selected options must be an array'),

    body('customizations.*.selectedOptions.*.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Option name must be between 1 and 100 characters'),

    body('customizations.*.selectedOptions.*.price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Option price must be a positive number'),

    body('specialInstructions')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Special instructions cannot exceed 200 characters'),

    handleValidationErrors
  ],

  updateCartItem: [
    body('quantity')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Quantity must be between 1 and 10'),
  
    body('specialInstructions')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Special instructions cannot exceed 200 characters'),
  
    handleValidationErrors
  ],

  setDeliveryAddress: [
    body('addressId')
      .matches(patterns.objectId)
      .withMessage('Invalid address ID'),
  
    handleValidationErrors
  ],

  // Order validation
  checkout: [
    body('paymentMethod')
      .isIn(['cash_on_delivery', 'online', 'wallet'])
      .withMessage('Invalid payment method'),
  
    body('deliveryAddressId')
      .optional()
      .matches(patterns.objectId)
      .withMessage('Invalid delivery address ID'),
  
    body('orderType')
      .optional()
      .isIn(['delivery', 'pickup'])
      .withMessage('Invalid order type'),
  
    body('specialInstructions')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Special instructions cannot exceed 500 characters'),
  
    handleValidationErrors
  ],

  updateOrderStatus: [
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'])
      .withMessage('Invalid order status'),
  
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters'),
  
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Notes cannot exceed 300 characters'),
  
    handleValidationErrors
  ],

  cancelOrder: [
    body('reason')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Cancellation reason must be between 5 and 200 characters'),
  
    handleValidationErrors
  ],

  assignDeliveryPersonnel: [
    body('deliveryPersonnelId')
      .matches(patterns.objectId)
      .withMessage('Invalid delivery personnel ID'),
  
    handleValidationErrors
  ],

  addOrderRating: [
    body('overall')
      .isInt({ min: 1, max: 5 })
      .withMessage('Overall rating must be between 1 and 5'),
  
    body('food')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Food rating must be between 1 and 5'),
  
    body('delivery')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Delivery rating must be between 1 and 5'),
  
    body('review')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Review cannot exceed 500 characters'),
  
    handleValidationErrors
  ],
  
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<[^>]*>/g, '').trim();
    }
    return value;
  };
  
  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };
  
  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  next();
};

module.exports = {
  validationRules,
  handleValidationErrors,
  sanitizeInput,
  patterns
};
