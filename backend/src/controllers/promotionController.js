const Promotion = require("../models/Promotion");
const promotionService = require("../services/promotionService");
const User = require("../models/User");

class PromotionController {
  // Get all promotions (Admin)
  async getPromotions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      let query = {};

      // Apply filters
      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const [promotions, totalPromotions] = await Promise.all([
        Promotion.find(query)
          .populate("createdBy", "firstName lastName email")
          .populate("applicableTo.categories", "name")
          .populate("applicableTo.products", "name")
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip),
        Promotion.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalPromotions / parseInt(limit));

      res.status(200).json({
        status: "success",
        data: {
          promotions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPromotions,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get promotions error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch promotions",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Create new promotion (Admin)
  async createPromotion(req, res) {
    try {
      const adminId = req.user._id;
      const promotionData = {
        ...req.body,
        createdBy: adminId,
      };

      // Validate promotion code uniqueness
      const existingPromotion = await Promotion.findOne({
        code: promotionData.code.toUpperCase(),
      });

      if (existingPromotion) {
        return res.status(409).json({
          status: "error",
          message: "Promotion code already exists",
          code: "CODE_EXISTS",
        });
      }

      // Validate dates
      if (
        new Date(promotionData.validity.startDate) >=
        new Date(promotionData.validity.endDate)
      ) {
        return res.status(400).json({
          status: "error",
          message: "End date must be after start date",
          code: "INVALID_DATES",
        });
      }

      const promotion = new Promotion(promotionData);
      await promotion.save();

      await promotion.populate("createdBy", "firstName lastName email");

      console.log(
        `✅ Promotion created: ${promotion.code} by ${req.user.email}`
      );

      res.status(201).json({
        status: "success",
        message: "Promotion created successfully",
        data: { promotion },
      });
    } catch (error) {
      console.error("❌ Create promotion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to create promotion",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get single promotion
  async getPromotion(req, res) {
    try {
      const { promotionId } = req.params;

      const promotion = await Promotion.findById(promotionId)
        .populate("createdBy", "firstName lastName email")
        .populate("applicableTo.categories", "name slug")
        .populate("applicableTo.products", "name slug price");

      if (!promotion) {
        return res.status(404).json({
          status: "error",
          message: "Promotion not found",
          code: "PROMOTION_NOT_FOUND",
        });
      }

      // Get analytics if admin
      let analytics = null;
      if (req.user.role === "admin") {
        const endDate = new Date();
        const startDate = new Date(promotion.validity.startDate);

        analytics = await promotionService.getPromotionAnalytics(
          promotion._id,
          startDate,
          endDate
        );
      }

      res.status(200).json({
        status: "success",
        data: {
          promotion,
          analytics,
        },
      });
    } catch (error) {
      console.error("❌ Get promotion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch promotion details",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update promotion (Admin)
  async updatePromotion(req, res) {
    try {
      const { promotionId } = req.params;
      const updateData = req.body;

      const promotion = await Promotion.findById(promotionId);

      if (!promotion) {
        return res.status(404).json({
          status: "error",
          message: "Promotion not found",
          code: "PROMOTION_NOT_FOUND",
        });
      }

      // Validate code uniqueness if code is being updated
      if (updateData.code && updateData.code.toUpperCase() !== promotion.code) {
        const existingPromotion = await Promotion.findOne({
          code: updateData.code.toUpperCase(),
          _id: { $ne: promotionId },
        });

        if (existingPromotion) {
          return res.status(409).json({
            status: "error",
            message: "Promotion code already exists",
            code: "CODE_EXISTS",
          });
        }
      }

      // Update promotion
      Object.assign(promotion, updateData);
      await promotion.save();

      await promotion.populate("createdBy", "firstName lastName email");

      console.log(
        `✅ Promotion updated: ${promotion.code} by ${req.user.email}`
      );

      res.status(200).json({
        status: "success",
        message: "Promotion updated successfully",
        data: { promotion },
      });
    } catch (error) {
      console.error("❌ Update promotion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update promotion",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete promotion (Admin)
  async deletePromotion(req, res) {
    try {
      const { promotionId } = req.params;

      const promotion = await Promotion.findById(promotionId);

      if (!promotion) {
        return res.status(404).json({
          status: "error",
          message: "Promotion not found",
          code: "PROMOTION_NOT_FOUND",
        });
      }

      // Soft delete by setting status to disabled
      promotion.status = "disabled";
      await promotion.save();

      console.log(
        `✅ Promotion deleted: ${promotion.code} by ${req.user.email}`
      );

      res.status(200).json({
        status: "success",
        message: "Promotion deleted successfully",
      });
    } catch (error) {
      console.error("❌ Delete promotion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete promotion",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Apply promotion code (Customer)
  async applyPromotionCode(req, res) {
    try {
      const { code, orderDetails } = req.body;
      const userId = req.user._id;

      if (!code || !orderDetails) {
        return res.status(400).json({
          status: "error",
          message: "Promotion code and order details are required",
          code: "MISSING_DATA",
        });
      }

      const result = await promotionService.applyPromotion(
        code,
        userId,
        orderDetails
      );

      if (result.success) {
        res.status(200).json({
          status: "success",
          message: "Promotion applied successfully",
          data: result,
        });
      } else {
        res.status(400).json({
          status: "error",
          message: result.message,
          code: result.code,
        });
      }
    } catch (error) {
      console.error("❌ Apply promotion error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to apply promotion",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get valid promotions for user
  async getValidPromotions(req, res) {
    try {
      const userId = req.user._id;
      const { orderAmount = 0, categories = [] } = req.query;

      const validPromotions = await promotionService.getValidPromotions(
        userId,
        parseFloat(orderAmount),
        Array.isArray(categories) ? categories : categories.split(",")
      );

      res.status(200).json({
        status: "success",
        data: {
          promotions: validPromotions,
          count: validPromotions.length,
        },
      });
    } catch (error) {
      console.error("❌ Get valid promotions error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch valid promotions",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Generate bulk promotion codes (Admin)
  async generateBulkCodes(req, res) {
    try {
      const { promotionId } = req.params;
      const { count = 100, prefix = "BULK" } = req.body;

      if (count > 1000) {
        return res.status(400).json({
          status: "error",
          message: "Maximum 1000 codes can be generated at once",
          code: "LIMIT_EXCEEDED",
        });
      }

      const codes = await promotionService.generateBulkCodes(
        promotionId,
        count,
        prefix
      );

      console.log(
        `✅ Generated ${codes.length} bulk codes for promotion ${promotionId}`
      );

      res.status(200).json({
        status: "success",
        message: `${codes.length} promotion codes generated successfully`,
        data: {
          codes,
          count: codes.length,
          basePromotionId: promotionId,
        },
      });
    } catch (error) {
      console.error("❌ Generate bulk codes error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to generate bulk codes",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get promotion analytics (Admin)
  async getPromotionAnalytics(req, res) {
    try {
      const { promotionId } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await promotionService.getPromotionAnalytics(
        promotionId,
        start,
        end
      );

      if (!analytics) {
        return res.status(404).json({
          status: "error",
          message: "Promotion not found",
          code: "PROMOTION_NOT_FOUND",
        });
      }

      res.status(200).json({
        status: "success",
        data: analytics,
      });
    } catch (error) {
      console.error("❌ Get promotion analytics error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch promotion analytics",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Optimize promotions (Admin)
  async optimizePromotions(req, res) {
    try {
      const result = await promotionService.optimizePromotions();

      res.status(200).json({
        status: "success",
        message: "Promotions optimized successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Optimize promotions error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to optimize promotions",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new PromotionController();
