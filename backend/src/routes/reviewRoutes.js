const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const reviewController = require("../controllers/reviewController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for review operations
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    status: "error",
    message: "Too many review requests. Please try again later.",
  },
});

// Apply rate limiting
router.use(reviewLimiter);

// Public routes
router.get("/product/:productId", reviewController.getProductReviews);

// Protected routes
router.use(AuthMiddleware.authenticate);

router.post(
  "/",
  JoiValidationMiddleware.validate("createReview"),
  reviewController.createReview
);

router.get("/my-reviews", reviewController.getUserReviews);

router.put(
  "/:reviewId",
  JoiValidationMiddleware.validate("updateReview"),
  reviewController.updateReview
);

router.delete("/:reviewId", reviewController.deleteReview);

router.post("/:reviewId/helpful", reviewController.markHelpful);

module.exports = router;
