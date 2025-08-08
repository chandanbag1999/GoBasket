const fileService = require("../services/fileService");
const User = require("../models/User");

class FileController {
  // ✅ ENHANCED: Upload profile picture with better error handling and debugging
  async uploadProfile(req, res) {
    try {
      console.log(`🔍 Upload Profile Debug Information:`);
      console.log(`- req.file:`, req.file);
      console.log(`- req.files:`, req.files);
      console.log(`- req.body:`, req.body);
      console.log(`- Content-Type:`, req.headers["content-type"]);
      console.log(`- User:`, req.user ? req.user.email : "No user");

      // Handle both single file and flexible uploads
      let uploadedFile = req.file;

      // If using .any() middleware, files are in req.files array
      if (!uploadedFile && req.files && req.files.length > 0) {
        uploadedFile = req.files[0];
        console.log(`🔍 Using first file from req.files array:`, uploadedFile);
      }

      if (!uploadedFile) {
        return res.status(400).json({
          status: "error",
          message:
            'Profile picture file is required. Please upload a file with field name "profilePicture".',
          code: "NO_FILE_UPLOADED",
          expectedFieldName: "profilePicture",
          debug: {
            receivedFiles: req.files ? req.files.length : 0,
            receivedFile: req.file ? "yes" : "no",
            contentType: req.headers["content-type"],
            hasUser: req.user ? "yes" : "no",
          },
        });
      }

      let uploadResult;
      try {
        // Try standard validation first
        uploadResult = fileService.validateUploadResult(uploadedFile);
      } catch (validationError) {
        console.warn("❌ Standard validation failed:", validationError.message);
        console.log("🔄 Trying debug validation...");

        try {
          // Fallback to debug validation
          uploadResult = fileService.validateUploadResultDebug(uploadedFile);
        } catch (debugError) {
          console.error(
            "❌ Both validation methods failed:",
            debugError.message
          );

          return res.status(500).json({
            status: "error",
            message: "Failed to process uploaded file",
            code: "UPLOAD_VALIDATION_FAILED",
            debug: {
              originalError: validationError.message,
              debugError: debugError.message,
              uploadedFileStructure: uploadedFile,
              availableFields: Object.keys(uploadedFile),
            },
          });
        }
      }

      const userId = req.user._id;

      // Update user profile with new profile picture
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Delete old profile picture if exists
      if (user.profilePicture && user.profilePicture.publicId) {
        try {
          await fileService.deleteFile(user.profilePicture.publicId);
          console.log(
            `✅ Old profile picture deleted: ${user.profilePicture.publicId}`
          );
        } catch (deleteError) {
          console.warn(
            "⚠️ Failed to delete old profile picture:",
            deleteError.message
          );
          // Don't fail the upload if old file deletion fails
        }
      }

      // Update user with new profile picture
      user.profilePicture = {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        uploadedAt: new Date(),
      };

      await user.save();

      console.log(
        `✅ Profile picture uploaded successfully for user ${req.user.email}`
      );

      res.status(200).json({
        status: "success",
        message: "Profile picture uploaded successfully",
        data: {
          profilePicture: user.profilePicture,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        },
      });
    } catch (error) {
      console.error("❌ Profile upload error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to upload profile picture",
        ...(process.env.NODE_ENV === "development" && {
          error: error.message,
          stack: error.stack,
        }),
      });
    }
  }

  // Upload multiple documents
  async uploadDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: "error",
          message:
            'At least one document file is required. Use field name "documents".',
          code: "NO_FILES_UPLOADED",
          expectedFieldName: "documents",
        });
      }

      const uploadedFiles = [];
      for (const file of req.files) {
        try {
          const validatedFile = fileService.validateUploadResult(file);
          uploadedFiles.push(validatedFile);
        } catch (fileError) {
          console.warn(
            `⚠️ Failed to validate file ${file.originalname}:`,
            fileError.message
          );
          // Continue with other files, don't fail the entire upload
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No files could be processed successfully",
          code: "NO_VALID_FILES",
        });
      }

      console.log(
        `✅ ${uploadedFiles.length} documents uploaded for user ${req.user.email}`
      );

      res.status(200).json({
        status: "success",
        message: `${uploadedFiles.length} documents uploaded successfully`,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
      });
    } catch (error) {
      console.error("❌ Document upload error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to upload documents",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Upload product images (admin/vendor only)
  async uploadProductImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: "error",
          message:
            'At least one product image is required. Use field name "productImages".',
          code: "NO_FILES_UPLOADED",
          expectedFieldName: "productImages",
        });
      }

      const uploadedImages = [];
      for (const file of req.files) {
        try {
          const validatedFile = fileService.validateUploadResult(file);
          uploadedImages.push(validatedFile);
        } catch (fileError) {
          console.warn(
            `⚠️ Failed to validate image ${file.originalname}:`,
            fileError.message
          );
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No images could be processed successfully",
          code: "NO_VALID_IMAGES",
        });
      }

      console.log(`✅ ${uploadedImages.length} product images uploaded`);

      res.status(200).json({
        status: "success",
        message: `${uploadedImages.length} product images uploaded successfully`,
        data: {
          images: uploadedImages,
          count: uploadedImages.length,
        },
      });
    } catch (error) {
      console.error("❌ Product image upload error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to upload product images",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete file by public ID
  async deleteFile(req, res) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          status: "error",
          message: "File public ID is required",
          code: "MISSING_PUBLIC_ID",
        });
      }

      const result = await fileService.deleteFile(publicId);

      if (!result.success) {
        return res.status(404).json({
          status: "error",
          message: "File not found or already deleted",
          code: "FILE_NOT_FOUND",
        });
      }

      console.log(`✅ File deleted: ${publicId}`);

      res.status(200).json({
        status: "success",
        message: "File deleted successfully",
        data: {
          publicId: result.publicId,
        },
      });
    } catch (error) {
      console.error("❌ File deletion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete file",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete multiple files
  async deleteFiles(req, res) {
    try {
      const { publicIds } = req.body;

      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Array of public IDs is required",
          code: "MISSING_PUBLIC_IDS",
        });
      }

      const result = await fileService.deleteFiles(publicIds);

      console.log(
        `✅ Bulk delete completed: ${result.deletedCount}/${result.totalRequested} files`
      );

      res.status(200).json({
        status: "success",
        message: `${result.deletedCount} out of ${result.totalRequested} files deleted successfully`,
        data: result,
      });
    } catch (error) {
      console.error("❌ Bulk file deletion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete files",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get file information
  async getFileInfo(req, res) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          status: "error",
          message: "File public ID is required",
          code: "MISSING_PUBLIC_ID",
        });
      }

      const fileInfo = await fileService.getFileInfo(publicId);

      res.status(200).json({
        status: "success",
        data: fileInfo,
      });
    } catch (error) {
      console.error("❌ Get file info error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          status: "error",
          message: "File not found",
          code: "FILE_NOT_FOUND",
        });
      }

      res.status(500).json({
        status: "error",
        message: "Failed to get file information",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // List files in a folder (admin only)
  async listFiles(req, res) {
    try {
      const { folder } = req.params;
      const { limit = 50 } = req.query;

      if (!folder) {
        return res.status(400).json({
          status: "error",
          message: "Folder path is required",
          code: "MISSING_FOLDER",
        });
      }

      const result = await fileService.listFiles(folder, parseInt(limit));

      res.status(200).json({
        status: "success",
        message: `Found ${result.files.length} files in folder ${folder}`,
        data: result,
      });
    } catch (error) {
      console.error("❌ List files error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to list files",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new FileController();
