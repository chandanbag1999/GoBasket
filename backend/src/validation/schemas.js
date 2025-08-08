const Joi = require('joi');

// Custom validation patterns
const patterns = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^[1-9][0-9]{5}$/,
  otp: /^\d{6}$/,
  name: /^[a-zA-Z\s]+$/
};

// Custom error messages
const messages = {
  'string.pattern.base': 'Field format is invalid',
  'string.email': 'Please provide a valid email address',
  'string.min': 'Field must be at least {#limit} characters long',
  'string.max': 'Field cannot exceed {#limit} characters',
  'number.min': 'Value must be at least {#limit}',
  'number.max': 'Value cannot exceed {#limit}',
  'any.required': 'This field is required',
  'any.only': 'Field must be one of the allowed values'
};

const validationSchemas = {
  // User Registration Schema
  register: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .max(100)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email cannot exceed 100 characters',
        'any.required': 'Email is required'
      }),

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        'any.required': 'Password is required'
      }),

    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(patterns.name)
      .trim()
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces',
        'any.required': 'First name is required'
      }),

    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(patterns.name)
      .trim()
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'any.required': 'Last name is required'
      }),

    phone: Joi.string()
      .pattern(patterns.phone)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid Indian phone number (10 digits starting with 6-9)'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // User Login Schema
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Forgot Password Schema
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Reset Password Schema
  resetPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),

    otp: Joi.string()
      .length(6)
      .pattern(patterns.otp)
      .required()
      .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required'
      }),

    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        'any.required': 'New password is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Verify OTP Schema
  verifyOTP: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),

    otp: Joi.string()
      .length(6)
      .pattern(patterns.otp)
      .required()
      .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Email Verification Schema
  verifyEmail: Joi.object({
    token: Joi.string()
      .min(32)
      .max(128)
      .alphanum()
      .required()
      .messages({
        'string.min': 'Invalid token format',
        'string.max': 'Invalid token format',
        'string.alphanum': 'Token must be alphanumeric',
        'any.required': 'Verification token is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Refresh Token Schema
  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Address Schema
  address: Joi.object({
    type: Joi.string()
      .valid('home', 'work', 'other')
      .default('home')
      .messages({
        'any.only': 'Address type must be one of: home, work, other'
      }),

    street: Joi.string()
      .min(5)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.min': 'Street address must be at least 5 characters',
        'string.max': 'Street address cannot exceed 200 characters',
        'any.required': 'Street address is required'
      }),

    city: Joi.string()
      .min(2)
      .max(100)
      .pattern(patterns.name)
      .trim()
      .required()
      .messages({
        'string.min': 'City name must be at least 2 characters',
        'string.max': 'City name cannot exceed 100 characters',
        'string.pattern.base': 'City name can only contain letters and spaces',
        'any.required': 'City is required'
      }),

    state: Joi.string()
      .min(2)
      .max(100)
      .pattern(patterns.name)
      .trim()
      .required()
      .messages({
        'string.min': 'State name must be at least 2 characters',
        'string.max': 'State name cannot exceed 100 characters',
        'string.pattern.base': 'State name can only contain letters and spaces',
        'any.required': 'State is required'
      }),

    pincode: Joi.string()
      .pattern(patterns.pincode)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid 6-digit pincode',
        'any.required': 'Pincode is required'
      }),

    isDefault: Joi.boolean()
      .default(false)
  }).options({ abortEarly: false, stripUnknown: true }),

  // Update Profile Schema
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(patterns.name)
      .trim()
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),

    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(patterns.name)
      .trim()
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),

    phone: Joi.string()
      .pattern(patterns.phone)
      .optional()
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Please provide a valid Indian phone number (10 digits starting with 6-9)'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // Change Password Schema
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),

    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        'any.required': 'New password is required'
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Confirm password must match new password',
        'any.required': 'Confirm password is required'
      })
  }).options({ abortEarly: false, stripUnknown: true }),

  // File Upload Validation (for query params)
  fileUpload: Joi.object({
    folder: Joi.string()
      .valid('profiles', 'products', 'documents', 'misc')
      .default('misc')
      .messages({
        'any.only': 'Invalid folder. Allowed: profiles, products, documents, misc'
      }),

    resize: Joi.boolean().default(false),
    width: Joi.number().integer().min(50).max(2000).default(800),
    height: Joi.number().integer().min(50).max(2000).default(600)
  }).options({ abortEarly: false, stripUnknown: true })
};

module.exports = validationSchemas;
