const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const CacheMiddleware = require("../middleware/cacheMiddleware");
const cartController = require("../controllers/cartController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for cart operations
const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: "error",
    message: "Too many cart requests. Please try again later.",
  },
});

// All cart routes require authentication
router.use(AuthMiddleware.authenticate);
router.use(cartLimiter);

// Get cart with caching
router.get(
  "/",
  CacheMiddleware.cacheCart(60), // 1 minute
  cartController.getCart
);

// Add to cart with cache invalidation
router.post(
  "/add",
  JoiValidationMiddleware.validate("addToCart"),
  CacheMiddleware.invalidateCache([(req) => `cart:${req.user._id}`]),
  cartController.addToCart
);

// Update cart item with cache invalidation
router.put(
  "/item/:productId",
  JoiValidationMiddleware.validate("updateCartItem"),
  CacheMiddleware.invalidateCache([(req) => `cart:${req.user._id}`]),
  cartController.updateCartItem
);

// Remove from cart with cache invalidation
router.delete(
  "/item/:productId",
  CacheMiddleware.invalidateCache([(req) => `cart:${req.user._id}`]),
  cartController.removeFromCart
);

// Clear cart with cache invalidation
router.delete(
  "/clear",
  CacheMiddleware.invalidateCache([(req) => `cart:${req.user._id}`]),
  cartController.clearCart
);

module.exports = router;
