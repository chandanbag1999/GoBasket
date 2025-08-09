const express = require("express");
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

// Public routes
router.get("/", categoryController.getCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:slug", categoryController.getCategory);

module.exports = router;
