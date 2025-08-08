const Joi = require("joi");

// Common validation patterns
const common = {
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  password: Joi.string()
    .min(8)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    ),
  email: Joi.string().email().lowercase(),
};

// All validation schemas
const schemas = {
  // Authentication schemas
  register: Joi.object({
    email: common.email.required(),
    password: common.password.required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().allow("", null).max(50).optional(),
    phone: common.phone.optional(),
  }),

  login: Joi.object({
    email: common.email.required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  // Password reset schemas
  forgotPassword: Joi.object({
    email: common.email.required(),
  }),

  verifyOTP: Joi.object({
    email: common.email.required(),
    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required(),
  }),

  resetPassword: Joi.object({
    email: common.email.required(),
    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required(),
    newPassword: common.password.required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: common.password.required(),
  }),

  // Day 4 schemas
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().allow("", null).max(50).optional(),
    phone: common.phone.optional(),
  }),

  updatePreferences: Joi.object({
    language: Joi.string().valid("en", "hi").optional(),
    theme: Joi.string().valid("light", "dark", "system").optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      marketing: Joi.boolean().optional(),
      orderUpdates: Joi.boolean().optional(),
    }).optional(),
  }),

  createAddress: Joi.object({
    label: Joi.string().valid("home", "work", "other").default("home"),
    fullName: Joi.string().min(2).max(80).required(),
    phone: common.phone.required(),
    line1: Joi.string().min(3).max(120).required(),
    line2: Joi.string().allow("", null).max(120).optional(),
    landmark: Joi.string().allow("", null).max(120).optional(),
    city: Joi.string().min(2).max(60).required(),
    state: Joi.string().min(2).max(60).required(),
    pincode: common.pincode.required(),
    country: Joi.string().default("India").optional(),
    location: Joi.object({
      lat: common.lat.optional(),
      lng: common.lng.optional(),
    }).optional(),
    isDefault: Joi.boolean().default(false).optional(),
  }),

  updateAddress: Joi.object({
    label: Joi.string().valid("home", "work", "other").optional(),
    fullName: Joi.string().min(2).max(80).optional(),
    phone: common.phone.optional(),
    line1: Joi.string().min(3).max(120).optional(),
    line2: Joi.string().allow("", null).max(120).optional(),
    landmark: Joi.string().allow("", null).max(120).optional(),
    city: Joi.string().min(2).max(60).optional(),
    state: Joi.string().min(2).max(60).optional(),
    pincode: common.pincode.optional(),
    country: Joi.string().optional(),
    location: Joi.object({
      lat: common.lat.optional(),
      lng: common.lng.optional(),
    }).optional(),
    isDefault: Joi.boolean().optional(),
  }),

  changeEmail: Joi.object({
    newEmail: common.email.required(),
  }),

  deleteAccount: Joi.object({
    reason: Joi.string().allow("", null).max(250).optional(),
    confirm: Joi.boolean().valid(true).required(),
  }),
};

// ✅ MAIN VALIDATION MIDDLEWARE FUNCTION
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      console.error(`❌ Validation schema not found: ${schemaName}`);
      console.error(`Available schemas: ${Object.keys(schemas).join(", ")}`);
      return res.status(500).json({
        status: "error",
        message: "Validation schema not found",
        code: "SCHEMA_NOT_FOUND",
        availableSchemas: Object.keys(schemas),
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error(
        `❌ Validation failed for schema: ${schemaName}`,
        error.details
      );

      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: error.details.map((detail) => ({
          field: detail.context?.key || detail.path?.join(".") || "unknown",
          message: detail.message,
          value: detail.context?.value,
          type: detail.type,
        })),
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    console.log(`✅ Validation passed for schema: ${schemaName}`);
    next();
  };
}

// ✅ EXPORT AS OBJECT WITH validate FUNCTION
module.exports = {
  validate,
  schemas,
  common,
};

// ✅ ALTERNATIVE: Export just the validate function (for backward compatibility)
module.exports.validate = validate;
