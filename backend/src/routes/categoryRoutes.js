const express = require("express");
const CacheMiddleware = require("../middleware/cacheMiddleware");
const categoryController = require("../controllers/categoryController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for category operations
const categoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    status: "error",
    message: "Too many category requests. Please try again later.",
  },
});

// Apply rate limiting
router.use(categoryLimiter);

// Public routes with aggressive caching (categories don't change often)
router.get(
  "/",
  CacheMiddleware.cacheCategories(3600), // 1 hour
  categoryController.getCategories
);

router.get(
  "/tree",
  CacheMiddleware.cache("categories:tree", 3600), // 1 hour
  categoryController.getCategoryTree
);

router.get(
  "/:slug",
  CacheMiddleware.cache((req) => `categories:single:${req.params.slug}`, 1800), // 30 minutes
  categoryController.getCategory
);

module.exports = router;
