const Joi = require("joi");

const common = {
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
};

const schemas = {
  // existing: register, login, refreshToken, verifyEmail, forgotPassword, verifyOTP, resetPassword, changePassword...

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().allow("", null).max(50).optional(),
    phone: common.phone.optional(),
  }),

  updatePreferences: Joi.object({
    language: Joi.string().valid("en", "hi").optional(),
    theme: Joi.string().valid("light", "dark", "system").optional(),
    notifications: Joi.object({
      email: Joi.boolean(),
      sms: Joi.boolean(),
      push: Joi.boolean(),
      marketing: Joi.boolean(),
      orderUpdates: Joi.boolean(),
    }).optional(),
  }),

  createAddress: Joi.object({
    label: Joi.string().valid("home", "work", "other").default("home"),
    fullName: Joi.string().min(2).max(80).required(),
    phone: common.phone.required(),
    line1: Joi.string().min(3).max(120).required(),
    line2: Joi.string().allow("", null).max(120),
    landmark: Joi.string().allow("", null).max(120),
    city: Joi.string().min(2).max(60).required(),
    state: Joi.string().min(2).max(60).required(),
    pincode: common.pincode.required(),
    country: Joi.string().default("India"),
    location: Joi.object({
      lat: common.lat.optional(),
      lng: common.lng.optional(),
    }).optional(),
    isDefault: Joi.boolean().default(false),
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
    newEmail: Joi.string().email().required(),
  }),

  deleteAccount: Joi.object({
    reason: Joi.string().allow("", null).max(250),
    confirm: Joi.boolean().valid(true).required(),
  }),
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema)
      return res
        .status(500)
        .json({ status: "error", message: "Validation schema not found" });
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: error.details.map((d) => ({
          field: d.context.key,
          message: d.message,
          type: d.type,
        })),
      });
    }
    req.body = value;
    next();
  };
}

module.exports = validate;
