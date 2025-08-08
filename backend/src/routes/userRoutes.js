const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const userController = require("../controllers/userController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for user operations
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and rate limiting to all routes
router.use(AuthMiddleware.authenticate);
router.use(userLimiter);

// Profile management routes
router.get("/me", userController.getMe);
router.put(
  "/profile",
  JoiValidationMiddleware.validate("updateProfile"),
  userController.updateProfile
);

// Preferences routes
router.put(
  "/preferences",
  JoiValidationMiddleware.validate("updatePreferences"),
  userController.updatePreferences
);

// Address management routes
router.get("/addresses", userController.listAddresses);
router.post(
  "/addresses",
  JoiValidationMiddleware.validate("createAddress"),
  userController.addAddress
);
router.put(
  "/addresses/:addressId",
  JoiValidationMiddleware.validate("updateAddress"),
  userController.updateAddress
);
router.delete("/addresses/:addressId", userController.deleteAddress);

// Email change routes
router.post(
  "/change-email/request",
  JoiValidationMiddleware.validate("changeEmail"),
  userController.requestChangeEmail
);
router.post("/change-email/confirm", userController.confirmChangeEmail);

// Account management
router.post(
  "/delete-account",
  JoiValidationMiddleware.validate("deleteAccount"),
  userController.deleteAccount
);

module.exports = router;
