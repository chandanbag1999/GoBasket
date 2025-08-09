const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const productController = require("../controllers/productController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for product operations
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    status: "error",
    message: "Too many product requests. Please try again later.",
  },
});

// Apply rate limiting
router.use(productLimiter);

// Public routes
router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/category/:categorySlug", productController.getProductsByCategory);
router.get("/:identifier", productController.getProduct);

module.exports = router;
