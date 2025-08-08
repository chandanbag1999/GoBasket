const express = require("express");
const authController = require("../controllers/authController");
const passwordController = require("../controllers/passwordController");
const fileController = require("../controllers/fileController");
const AuthMiddleware = require("../middleware/auth");
const JoiValidationMiddleware = require("../middleware/joiValidation");
const uploadMiddleware = require("../middleware/upload");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting configurations
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many authentication attempts. Please try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    message: "Too many OTP requests. Please try again later.",
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message: "Too many requests from this IP. Please try again later.",
  },
});

// Public routes
router.post(
  "/register",
  strictAuthLimiter,
  JoiValidationMiddleware.validate("register"),
  authController.register
);

router.post(
  "/login",
  strictAuthLimiter,
  JoiValidationMiddleware.validate("login"),
  authController.login
);

// Password reset routes
router.post(
  "/forgot-password",
  otpLimiter,
  JoiValidationMiddleware.validate("forgotPassword"),
  passwordController.forgotPassword
);

router.post(
  "/verify-reset-otp",
  otpLimiter,
  JoiValidationMiddleware.validate("verifyOTP"),
  passwordController.verifyResetOTP
);

router.post(
  "/reset-password",
  otpLimiter,
  JoiValidationMiddleware.validate("resetPassword"),
  passwordController.resetPassword
);

router.post(
  "/resend-otp",
  otpLimiter,
  JoiValidationMiddleware.validate("forgotPassword"),
  passwordController.resendOTP
);

router.get("/reset-status", generalLimiter, passwordController.getResetStatus);

// Token and verification routes
router.post(
  "/refresh-token",
  generalLimiter,
  JoiValidationMiddleware.validate("refreshToken"),
  authController.refreshToken
);

router.post(
  "/verify-email",
  generalLimiter,
  JoiValidationMiddleware.validate("verifyEmail"),
  authController.verifyEmail
);

// Protected routes
router.post(
  "/logout",
  generalLimiter,
  AuthMiddleware.authenticate,
  authController.logout
);

router.post(
  "/logout-all",
  generalLimiter,
  AuthMiddleware.authenticate,
  authController.logoutAll
);

router.get(
  "/profile",
  generalLimiter,
  AuthMiddleware.authenticate,
  authController.getProfile
);

router.post(
  "/change-password",
  generalLimiter,
  AuthMiddleware.authenticate,
  JoiValidationMiddleware.validate("changePassword"),
  passwordController.changePassword
);

// Session Management Routes
router.get(
  "/active-sessions",
  generalLimiter,
  AuthMiddleware.authenticate,
  authController.getActiveSessions
);

router.delete(
  "/session/:deviceId",
  generalLimiter,
  AuthMiddleware.authenticate,
  authController.logoutFromDevice
);

// ✅ FIXED: File Upload Routes with proper error handling
router.post(
  "/upload/profile",
  generalLimiter,
  AuthMiddleware.authenticate,
  uploadMiddleware.uploadProfile(),
  uploadMiddleware.handleMulterError(),
  fileController.uploadProfile
);

// ✅ ALTERNATIVE: Flexible profile upload route (accepts any field name)
router.post(
  "/upload/profile-flexible",
  generalLimiter,
  AuthMiddleware.authenticate,
  uploadMiddleware.uploadProfileFlexible(),
  uploadMiddleware.handleMulterError(),
  fileController.uploadProfile
);

router.post(
  "/upload/documents",
  generalLimiter,
  AuthMiddleware.authenticate,
  uploadMiddleware.uploadDocument(),
  uploadMiddleware.handleMulterError(),
  fileController.uploadDocuments
);

router.post(
  "/upload/products",
  generalLimiter,
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("admin", "vendor"),
  uploadMiddleware.uploadProductImages(),
  uploadMiddleware.handleMulterError(),
  fileController.uploadProductImages
);

// File Management Routes
router.delete(
  "/files/:publicId",
  generalLimiter,
  AuthMiddleware.authenticate,
  fileController.deleteFile
);

router.delete(
  "/files",
  generalLimiter,
  AuthMiddleware.authenticate,
  fileController.deleteFiles
);

router.get(
  "/files/:publicId/info",
  generalLimiter,
  AuthMiddleware.authenticate,
  fileController.getFileInfo
);

router.get(
  "/files/folder/:folder",
  generalLimiter,
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize("admin"),
  fileController.listFiles
);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Authentication service is running",
    timestamp: new Date().toISOString(),
    services: {
      jwt: "operational",
      redis: "operational",
      mongodb: "operational",
      cloudinary: "operational",
    },
  });
});

module.exports = router;
