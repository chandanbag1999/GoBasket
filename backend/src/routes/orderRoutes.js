const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const orderController = require("../controllers/orderController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for order operations
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    status: "error",
    message: "Too many order requests. Please try again later.",
  },
});

// All order routes require authentication
router.use(AuthMiddleware.authenticate);
router.use(orderLimiter);

// Get user's orders
router.get("/my-orders", orderController.getMyOrders);

// Get specific order
router.get("/:orderId", orderController.getOrderById);

// Cancel order
router.post("/:orderId/cancel", orderController.cancelOrder);

// Track order
router.get("/track/:orderNumber", orderController.trackOrder);

module.exports = router;
