const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const wishlistController = require("../controllers/wishlistController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for wishlist operations
const wishlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: "error",
    message: "Too many wishlist requests. Please try again later.",
  },
});

// All wishlist routes require authentication
router.use(AuthMiddleware.authenticate);
router.use(wishlistLimiter);

// Wishlist routes
router.get("/", wishlistController.getWishlist);

router.post(
  "/add",
  JoiValidationMiddleware.validate("addToWishlist"),
  wishlistController.addToWishlist
);

router.put(
  "/item/:productId",
  JoiValidationMiddleware.validate("updateWishlistItem"),
  wishlistController.updateWishlistItem
);

router.delete("/item/:productId", wishlistController.removeFromWishlist);

router.delete("/clear", wishlistController.clearWishlist);

router.put(
  "/settings",
  JoiValidationMiddleware.validate("updateWishlistSettings"),
  wishlistController.updateWishlistSettings
);

module.exports = router;
