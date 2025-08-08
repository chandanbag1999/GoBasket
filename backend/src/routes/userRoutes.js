const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const validate = require("../middleware/joiValidation");
const userController = require("../controllers/userController");

const rateLimit = require("express-rate-limit");

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

const router = express.Router();

router.use(AuthMiddleware.authenticate, userLimiter);

// Profile
router.get("/me", userController.getMe);
router.put("/profile", validate("updateProfile"), userController.updateProfile);

// Preferences
router.put(
  "/preferences",
  validate("updatePreferences"),
  userController.updatePreferences
);

// Addresses
router.get("/addresses", userController.listAddresses);
router.post("/addresses", validate("createAddress"), userController.addAddress);
router.put(
  "/addresses/:addressId",
  validate("updateAddress"),
  userController.updateAddress
);
router.delete("/addresses/:addressId", userController.deleteAddress);

// Change email
router.post(
  "/change-email/request",
  validate("changeEmail"),
  userController.requestChangeEmail
);
router.post("/change-email/confirm", userController.confirmChangeEmail);

// Delete account (soft)
router.post(
  "/delete-account",
  validate("deleteAccount"),
  userController.deleteAccount
);

module.exports = router;
