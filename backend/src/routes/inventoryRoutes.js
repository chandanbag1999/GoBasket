const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const inventoryController = require("../controllers/inventoryController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting
const inventoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    status: "error",
    message: "Too many inventory requests. Please try again later.",
  },
});

// All inventory routes require authentication and admin role
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorize("admin"));
router.use(inventoryLimiter);

// Inventory overview and reports
router.get("/overview", inventoryController.getInventoryOverview);
router.get("/low-stock", inventoryController.getLowStockProducts);
router.get("/movements", inventoryController.getStockMovements);
router.get("/report", inventoryController.generateStockReport);

// Stock management
router.put(
  "/products/:productId/stock",
  JoiValidationMiddleware.validate("updateStock"),
  inventoryController.updateProductStock
);

router.put(
  "/bulk-update",
  JoiValidationMiddleware.validate("bulkUpdateStock"),
  inventoryController.bulkUpdateStock
);

router.put(
  "/reorder-points",
  JoiValidationMiddleware.validate("setReorderPoints"),
  inventoryController.setReorderPoints
);

module.exports = router;
