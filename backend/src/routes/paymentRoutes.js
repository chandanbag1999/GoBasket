const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const paymentController = require("../controllers/paymentController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for payment operations
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    status: "error",
    message: "Too many payment requests. Please try again later.",
  },
});

// All payment routes require authentication
router.use(AuthMiddleware.authenticate);
router.use(paymentLimiter);

// Create payment order
router.post(
  "/create-order",
  JoiValidationMiddleware.validate("createPaymentOrder"),
  paymentController.createOrder
);

// Verify payment
router.post(
  "/verify",
  JoiValidationMiddleware.validate("verifyPayment"),
  paymentController.verifyPayment
);

// Handle payment failure
router.post(
  "/failed",
  JoiValidationMiddleware.validate("paymentFailed"),
  paymentController.paymentFailed
);

// Process refund (admin only)
router.post(
  "/refund/:orderId",
  AuthMiddleware.authorize("admin"),
  JoiValidationMiddleware.validate("processRefund"),
  paymentController.processRefund
);

module.exports = router;
