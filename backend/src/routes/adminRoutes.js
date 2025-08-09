const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const CacheMiddleware = require("../middleware/cacheMiddleware");
const adminController = require("../controllers/adminController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: "error",
    message: "Too many admin requests. Please try again later.",
  },
});

// All admin routes require authentication and admin role
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorize("admin"));
router.use(adminLimiter);

// Dashboard routes with caching
router.get(
  "/dashboard/overview",
  CacheMiddleware.cacheAnalytics("dashboard", 300), // 5 minutes
  adminController.getDashboardOverview
);

router.get(
  "/analytics/sales",
  CacheMiddleware.cacheAnalytics("sales", 600), // 10 minutes
  adminController.getSalesAnalytics
);

router.get(
  "/analytics/users",
  CacheMiddleware.cacheAnalytics("users", 600), // 10 minutes
  adminController.getUserAnalytics
);

router.get(
  "/analytics/inventory",
  CacheMiddleware.cacheAnalytics("inventory", 300), // 5 minutes
  adminController.getInventoryAnalytics
);

module.exports = router;
