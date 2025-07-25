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
    
    body('address')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    
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
    
    handleValidationErrors
  ],
  
  // ObjectId parameter validation
  objectIdParam: [
    param('id')
      .matches(patterns.objectId)
      .withMessage('Invalid ID format'),
    
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
  ]
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
