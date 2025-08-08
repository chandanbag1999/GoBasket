const cloudinaryConfig = require("../config/cloudinary");

class FileService {
  constructor() {
    this.cloudinary = cloudinaryConfig.getCloudinary();
  }

  // Delete single file from Cloudinary
  async deleteFile(publicId) {
    try {
      if (!publicId) {
        throw new Error("Public ID is required for file deletion");
      }

      const result = await this.cloudinary.uploader.destroy(publicId, {
        invalidate: true, // Invalidate CDN cache
      });

      console.log(`✅ File deleted from Cloudinary: ${publicId}`, result);

      return {
        success: result.result === "ok",
        publicId,
        result: result.result,
      };
    } catch (error) {
      console.error("❌ Error deleting file from Cloudinary:", error);
      throw error;
    }
  }

  // Delete multiple files from Cloudinary
  async deleteFiles(publicIds) {
    try {
      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        throw new Error("Public IDs array is required for bulk deletion");
      }

      const result = await this.cloudinary.api.delete_resources(publicIds, {
        invalidate: true,
      });

      console.log(
        `✅ Bulk delete completed for ${publicIds.length} files`,
        result
      );

      const deletedFiles = [];
      const failedFiles = [];

      publicIds.forEach((publicId) => {
        if (result.deleted[publicId] === "deleted") {
          deletedFiles.push(publicId);
        } else {
          failedFiles.push({
            publicId,
            error: result.deleted[publicId] || "Unknown error",
          });
        }
      });

      return {
        success: true,
        totalRequested: publicIds.length,
        deletedCount: deletedFiles.length,
        failedCount: failedFiles.length,
        deletedFiles,
        failedFiles,
      };
    } catch (error) {
      console.error("❌ Error in bulk file deletion:", error);
      throw error;
    }
  }

  // Get file info from Cloudinary
  async getFileInfo(publicId) {
    try {
      const result = await this.cloudinary.api.resource(publicId);

      return {
        success: true,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.secure_url,
        createdAt: result.created_at,
        folder: result.folder,
      };
    } catch (error) {
      console.error("❌ Error getting file info:", error);
      throw error;
    }
  }

  // List files in a folder
  async listFiles(folderPath, maxResults = 50) {
    try {
      const result = await this.cloudinary.search
        .expression(`folder:${folderPath}/*`)
        .max_results(maxResults)
        .sort_by([["created_at", "desc"]])
        .execute();

      const files = result.resources.map((resource) => ({
        publicId: resource.public_id,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        bytes: resource.bytes,
        url: resource.secure_url,
        createdAt: resource.created_at,
      }));

      return {
        success: true,
        totalCount: result.total_count,
        files,
      };
    } catch (error) {
      console.error("❌ Error listing files:", error);
      throw error;
    }
  }

  // ✅ FIXED: Enhanced validateUploadResult with proper handling of multer-storage-cloudinary response
  validateUploadResult(uploadResult) {
    if (!uploadResult) {
      throw new Error("Upload result is empty - no file was uploaded");
    }

    console.log("🔍 Validating upload result:", uploadResult);

    // ✅ Handle multer-storage-cloudinary response format
    // Based on search results, multer-storage-cloudinary returns:
    // {
    //   fieldname: 'profilePicture',
    //   originalname: 'image.jpg',
    //   encoding: '7bit',
    //   mimetype: 'image/jpeg',
    //   path: 'https://res.cloudinary.com/.../secure_url',
    //   size: 123456,
    //   filename: 'public_id_here'
    // }

    // Extract public_id and secure_url from multer-storage-cloudinary format
    let publicId,
      url,
      format,
      width,
      height,
      bytes,
      createdAt,
      originalName,
      resourceType;

    if (uploadResult.filename && uploadResult.path) {
      // Standard multer-storage-cloudinary format
      publicId = uploadResult.filename;
      url = uploadResult.path;
      format =
        uploadResult.format ||
        (uploadResult.mimetype ? uploadResult.mimetype.split("/")[1] : null);
      width = uploadResult.width;
      height = uploadResult.height;
      bytes = uploadResult.size;
      originalName = uploadResult.originalname;
      resourceType = uploadResult.resource_type || "image";
      createdAt = uploadResult.created_at || new Date().toISOString();
    } else if (uploadResult.public_id && uploadResult.secure_url) {
      // Direct Cloudinary API response format
      publicId = uploadResult.public_id;
      url = uploadResult.secure_url;
      format = uploadResult.format;
      width = uploadResult.width;
      height = uploadResult.height;
      bytes = uploadResult.bytes;
      createdAt = uploadResult.created_at;
      originalName = uploadResult.original_filename;
      resourceType = uploadResult.resource_type;
    } else {
      console.error("❌ Upload result structure:", uploadResult);
      throw new Error(
        "Upload result is missing required fields (public_id/filename and secure_url/path). This usually indicates a Cloudinary configuration issue."
      );
    }

    if (!publicId || !url) {
      throw new Error(
        `Missing required fields - publicId: ${publicId}, url: ${url}`
      );
    }

    const validatedResult = {
      publicId,
      url,
      format,
      width,
      height,
      bytes,
      createdAt,
      originalName,
      resourceType,
    };

    console.log("✅ Validated upload result:", validatedResult);
    return validatedResult;
  }

  // ✅ NEW: Helper method to extract public_id from Cloudinary URL
  extractPublicIdFromUrl(cloudinaryUrl) {
    try {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
      const matches = cloudinaryUrl.match(
        /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/
      );
      return matches ? matches[1] : null;
    } catch (error) {
      console.error("❌ Error extracting public_id from URL:", error);
      return null;
    }
  }

  // ✅ NEW: Alternative validation method for debugging
  validateUploadResultDebug(uploadResult) {
    console.log(
      "🔍 Debug - Full upload result:",
      JSON.stringify(uploadResult, null, 2)
    );

    if (!uploadResult) {
      throw new Error("Upload result is completely empty");
    }

    const availableFields = Object.keys(uploadResult);
    console.log("🔍 Available fields in upload result:", availableFields);

    // Try different possible field combinations
    const possibleMappings = [
      { publicId: "public_id", url: "secure_url" },
      { publicId: "filename", url: "path" },
      { publicId: "id", url: "url" },
      { publicId: "key", url: "location" },
    ];

    for (const mapping of possibleMappings) {
      const publicId = uploadResult[mapping.publicId];
      const url = uploadResult[mapping.url];

      if (publicId && url) {
        console.log(
          `✅ Found valid mapping: ${mapping.publicId} -> ${publicId}, ${mapping.url} -> ${url}`
        );

        return {
          publicId,
          url,
          format:
            uploadResult.format || uploadResult.mimetype?.split("/")[1] || null,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.size || uploadResult.bytes,
          createdAt: uploadResult.created_at || new Date().toISOString(),
          originalName:
            uploadResult.originalname || uploadResult.original_filename,
          resourceType: uploadResult.resource_type || "image",
        };
      }
    }

    throw new Error(
      `No valid field mapping found. Available fields: ${availableFields.join(
        ", "
      )}`
    );
  }
}

module.exports = new FileService();
