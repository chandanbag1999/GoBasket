const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const CacheMiddleware = require("../middleware/cacheMiddleware");
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

// Public routes with caching
router.get(
  "/",
  CacheMiddleware.cacheProducts(300), // 5 minutes
  productController.getProducts
);

router.get(
  "/search",
  CacheMiddleware.cacheSearchResults(300), // 5 minutes
  productController.searchProducts
);

router.get(
  "/featured",
  CacheMiddleware.cache("products:featured", 1800), // 30 minutes
  productController.getFeaturedProducts
);

router.get(
  "/category/:categorySlug",
  CacheMiddleware.cache(
    (req) => `products:category:${req.params.categorySlug}`,
    600
  ), // 10 minutes
  productController.getProductsByCategory
);

router.get(
  "/:identifier",
  CacheMiddleware.cacheProduct(1800), // 30 minutes
  productController.getProduct
);

module.exports = router;
