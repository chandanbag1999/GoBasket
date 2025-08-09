const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const notificationService = require("../services/notificationService");
const Notification = require("../models/Notification");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many notification requests. Please try again later.",
  },
});

// All notification routes require authentication and admin role
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorize("admin"));
router.use(notificationLimiter);

// Send notification
router.post(
  "/send",
  JoiValidationMiddleware.validate("sendNotification"),
  async (req, res) => {
    try {
      const result = await notificationService.sendNotification(req.body);

      res.status(result.success ? 200 : 400).json({
        status: result.success ? "success" : "error",
        message: result.success
          ? "Notification sent successfully"
          : result.message,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to send notification",
        error: error.message,
      });
    }
  }
);

// Get notifications
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (type) query.type = type;
    if (status) query["delivery.status"] = status;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalNotifications: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// Get notification analytics
router.get("/analytics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await notificationService.getNotificationAnalytics(
      start,
      end
    );

    res.status(200).json({
      status: "success",
      data: { analytics },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch notification analytics",
      error: error.message,
    });
  }
});

module.exports = router;
