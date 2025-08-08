const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinaryConfig = require("../config/cloudinary");

class FileUploadMiddleware {
  constructor() {
    this.cloudinary = cloudinaryConfig.getCloudinary();
    this.setupStorages();
  }

  setupStorages() {
    // Profile pictures storage
    this.profileStorage = new CloudinaryStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: "grocery-app/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto:good", format: "auto" },
        ],
        public_id: (req, file) => {
          const userId = req.user?._id || req.body.userId || Date.now();
          return `profile_${userId}_${Date.now()}`;
        },
      },
    });

    // Document storage
    this.documentStorage = new CloudinaryStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: "grocery-app/documents",
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
        public_id: (req, file) => {
          const userId = req.user?._id || req.body.userId || Date.now();
          const originalName = file.originalname.split(".")[0];
          return `doc_${userId}_${originalName}_${Date.now()}`;
        },
      },
    });

    // Product images storage
    this.productStorage = new CloudinaryStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: "grocery-app/products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          { width: 800, height: 800, crop: "fill" },
          { quality: "auto:good", format: "auto" },
        ],
        public_id: (req, file) => {
          const productId = req.body.productId || Date.now();
          return `product_${productId}_${Date.now()}`;
        },
      },
    });
  }

  // File filter function
  createFileFilter(allowedTypes) {
    return (req, file, cb) => {
      console.log(
        `🔍 File filter - Field: ${file.fieldname}, MimeType: ${file.mimetype}, OriginalName: ${file.originalname}`
      );

      // Check file type
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        );
        error.code = "INVALID_FILE_TYPE";
        cb(error, false);
      }
    };
  }

  // ✅ FIXED: Profile picture upload middleware with flexible field names
  uploadProfile() {
    return multer({
      storage: this.profileStorage,
      fileFilter: this.createFileFilter([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1, // Single file only
      },
    }).single("profilePicture"); // ✅ This expects field name 'profilePicture'
  }

  // ✅ ALTERNATIVE: Flexible upload that accepts common field names
  uploadProfileFlexible() {
    return multer({
      storage: this.profileStorage,
      fileFilter: this.createFileFilter([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }).any(); // ✅ Accepts any field name
  }

  // Document upload middleware
  uploadDocument() {
    return multer({
      storage: this.documentStorage,
      fileFilter: this.createFileFilter([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ]),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5, // Multiple files allowed
      },
    }).array("documents", 5);
  }

  // Product images upload middleware
  uploadProductImages() {
    return multer({
      storage: this.productStorage,
      fileFilter: this.createFileFilter([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]),
      limits: {
        fileSize: 8 * 1024 * 1024, // 8MB limit
        files: 6, // Up to 6 product images
      },
    }).array("productImages", 6);
  }

  // ✅ ENHANCED: Error handling middleware with better debugging
  handleMulterError() {
    return (error, req, res, next) => {
      console.log(`🔍 Multer Error Debug:`);
      console.log(`- Error Code: ${error.code}`);
      console.log(`- Error Message: ${error.message}`);
      console.log(`- Field Name: ${error.field}`);
      console.log(`- Request Content-Type: ${req.headers["content-type"]}`);

      if (error instanceof multer.MulterError) {
        let message = "File upload error";
        let statusCode = 400;

        switch (error.code) {
          case "LIMIT_FILE_SIZE":
            message = "File too large. Maximum size is 5MB per file.";
            break;
          case "LIMIT_FILE_COUNT":
            message = "Too many files. Maximum allowed is specified limit.";
            break;
          case "LIMIT_UNEXPECTED_FILE":
            message = `Unexpected field name "${error.field}". Expected field name is "profilePicture" for profile uploads.`;
            statusCode = 422;
            break;
          case "MISSING_FIELD_NAME":
            message = "Missing field name in multipart form data.";
            break;
          default:
            message = error.message;
        }

        return res.status(statusCode).json({
          status: "error",
          message,
          code: error.code,
          expectedFieldName: "profilePicture",
          receivedFieldName: error.field,
          debug: {
            contentType: req.headers["content-type"],
            hasFiles: req.files ? Object.keys(req.files) : "none",
            hasFile: req.file ? req.file.fieldname : "none",
          },
        });
      }

      if (error.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          status: "error",
          message: error.message,
          code: "INVALID_FILE_TYPE",
        });
      }

      next(error);
    };
  }
}

module.exports = new FileUploadMiddleware();
