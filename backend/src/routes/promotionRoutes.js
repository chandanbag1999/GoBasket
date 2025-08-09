const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const promotionController = require("../controllers/promotionController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting
const promotionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many promotion requests. Please try again later.",
  },
});

// All routes require authentication
router.use(AuthMiddleware.authenticate);
router.use(promotionLimiter);

// Customer routes
router.get("/valid", promotionController.getValidPromotions);
router.post(
  "/apply",
  JoiValidationMiddleware.validate("applyPromotion"),
  promotionController.applyPromotionCode
);

// Admin routes
router.get(
  "/",
  AuthMiddleware.authorize("admin"),
  promotionController.getPromotions
);

router.post(
  "/",
  AuthMiddleware.authorize("admin"),
  JoiValidationMiddleware.validate("createPromotion"),
  promotionController.createPromotion
);

router.get("/:promotionId", promotionController.getPromotion);

router.put(
  "/:promotionId",
  AuthMiddleware.authorize("admin"),
  JoiValidationMiddleware.validate("updatePromotion"),
  promotionController.updatePromotion
);

router.delete(
  "/:promotionId",
  AuthMiddleware.authorize("admin"),
  promotionController.deletePromotion
);

router.post(
  "/:promotionId/bulk-codes",
  AuthMiddleware.authorize("admin"),
  JoiValidationMiddleware.validate("generateBulkCodes"),
  promotionController.generateBulkCodes
);

router.get(
  "/:promotionId/analytics",
  AuthMiddleware.authorize("admin"),
  promotionController.getPromotionAnalytics
);

router.post(
  "/optimize",
  AuthMiddleware.authorize("admin"),
  promotionController.optimizePromotions
);

module.exports = router;
