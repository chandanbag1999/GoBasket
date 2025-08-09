const Promotion = require("../models/Promotion");
const Order = require("../models/Order");
const User = require("../models/User");

class PromotionService {
  // Apply promotion to order
  async applyPromotion(code, userId, orderDetails) {
    try {
      console.log(`🎟️ Applying promotion code: ${code} for user: ${userId}`);

      const promotion = await Promotion.findByCode(code);
      if (!promotion) {
        return {
          success: false,
          message: "Invalid promotion code",
          code: "INVALID_CODE",
        };
      }

      // Get user details for validation
      const user = await User.findById(userId);
      const userType = this.determineUserType(user);

      // Check if promotion can be used
      const canUse = promotion.canBeUsedBy(
        userId,
        orderDetails.subtotal,
        userType
      );
      if (!canUse.valid) {
        return {
          success: false,
          message: canUse.reason,
          code: "NOT_ELIGIBLE",
        };
      }

      // Calculate discount
      const discountAmount = promotion.calculateDiscount(
        orderDetails.subtotal,
        orderDetails.items
      );

      // Validate discount
      if (discountAmount <= 0) {
        return {
          success: false,
          message: "Promotion is not applicable to your order",
          code: "NO_DISCOUNT",
        };
      }

      const result = {
        success: true,
        promotion: {
          id: promotion._id,
          name: promotion.name,
          code: promotion.code,
          type: promotion.type,
          description: promotion.description,
        },
        discount: {
          amount: discountAmount,
          type: promotion.type,
          originalAmount: orderDetails.subtotal,
          finalAmount: Math.max(0, orderDetails.subtotal - discountAmount),
        },
      };

      // Handle free shipping
      if (promotion.type === "free_shipping") {
        result.freeShipping = true;
        result.discount.shippingDiscount = orderDetails.deliveryFee || 0;
      }

      console.log(
        `✅ Promotion applied successfully: ₹${discountAmount} discount`
      );
      return result;
    } catch (error) {
      console.error("❌ Error applying promotion:", error);
      return {
        success: false,
        message: "Failed to apply promotion",
        code: "SYSTEM_ERROR",
      };
    }
  }

  // Finalize promotion usage (called after successful payment)
  async finalizePromotionUsage(
    promotionId,
    userId,
    orderAmount,
    discountApplied
  ) {
    try {
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) return false;

      promotion.recordUsage(userId, orderAmount, discountApplied);
      await promotion.save();

      console.log(`✅ Promotion usage finalized: ${promotion.code}`);
      return true;
    } catch (error) {
      console.error("❌ Error finalizing promotion usage:", error);
      return false;
    }
  }

  // Get valid promotions for user
  async getValidPromotions(userId, orderAmount = 0, categories = []) {
    try {
      const user = await User.findById(userId);
      const userType = this.determineUserType(user);

      const promotions = await Promotion.findValidPromotions(
        userType,
        categories
      );

      const validPromotions = [];

      for (const promotion of promotions) {
        const canUse = promotion.canBeUsedBy(userId, orderAmount, userType);
        if (canUse.valid) {
          validPromotions.push({
            id: promotion._id,
            name: promotion.name,
            code: promotion.code,
            type: promotion.type,
            description: promotion.description,
            discount: promotion.discount,
            minOrderAmount: promotion.discount.minOrderAmount,
            maxDiscount: promotion.discount.maxDiscount,
            validUntil: promotion.validity.endDate,
            usageLeft: promotion.remainingUses,
          });
        }
      }

      return validPromotions;
    } catch (error) {
      console.error("❌ Error getting valid promotions:", error);
      return [];
    }
  }

  // Auto-apply best promotion
  async getBestPromotion(userId, orderDetails) {
    try {
      const validPromotions = await this.getValidPromotions(
        userId,
        orderDetails.subtotal,
        orderDetails.categories
      );

      if (validPromotions.length === 0) return null;

      let bestPromotion = null;
      let maxDiscount = 0;

      for (const promotion of validPromotions) {
        const fullPromotion = await Promotion.findById(promotion.id);
        const discount = fullPromotion.calculateDiscount(
          orderDetails.subtotal,
          orderDetails.items
        );

        if (discount > maxDiscount) {
          maxDiscount = discount;
          bestPromotion = {
            ...promotion,
            calculatedDiscount: discount,
          };
        }
      }

      return bestPromotion;
    } catch (error) {
      console.error("❌ Error finding best promotion:", error);
      return null;
    }
  }

  // Validate promotion rules (complex logic)
  async validatePromotionRules(promotion, userId, orderDetails) {
    try {
      // Category-specific validation
      if (
        promotion.applicableTo.categories &&
        promotion.applicableTo.categories.length > 0
      ) {
        const hasValidCategory = orderDetails.items.some((item) =>
          promotion.applicableTo.categories.includes(item.categoryId)
        );

        if (!hasValidCategory) {
          return {
            valid: false,
            reason: "Promotion not applicable to selected products",
          };
        }
      }

      // Product-specific validation
      if (
        promotion.applicableTo.products &&
        promotion.applicableTo.products.length > 0
      ) {
        const hasValidProduct = orderDetails.items.some((item) =>
          promotion.applicableTo.products.includes(item.productId)
        );

        if (!hasValidProduct) {
          return {
            valid: false,
            reason: "Promotion not applicable to selected products",
          };
        }
      }

      // Location-based validation
      if (
        promotion.applicableTo.cities &&
        promotion.applicableTo.cities.length > 0
      ) {
        const userCity = orderDetails.shippingAddress?.city;
        if (!promotion.applicableTo.cities.includes(userCity)) {
          return {
            valid: false,
            reason: "Promotion not available in your location",
          };
        }
      }

      // Purchase history validation
      if (promotion.applicableTo.minPurchaseHistory) {
        const orderCount = await Order.countDocuments({
          userId,
          "payment.status": "completed",
        });

        if (orderCount < promotion.applicableTo.minPurchaseHistory) {
          return {
            valid: false,
            reason: `Minimum ${promotion.applicableTo.minPurchaseHistory} previous orders required`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error("❌ Error validating promotion rules:", error);
      return { valid: false, reason: "Validation error" };
    }
  }

  // Determine user type based on order history
  determineUserType(user) {
    if (!user) return "new";

    // This could be enhanced with more sophisticated logic
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);

    if (daysOld < 7) return "new";
    return "returning";
  }

  // Generate bulk promotion codes
  async generateBulkCodes(promotionId, count = 100, prefix = "BULK") {
    try {
      const basePromotion = await Promotion.findById(promotionId);
      if (!basePromotion) {
        throw new Error("Base promotion not found");
      }

      const codes = [];

      for (let i = 0; i < count; i++) {
        const uniqueCode = `${prefix}${Date.now()}${i
          .toString()
          .padStart(3, "0")}`;

        const newPromotion = new Promotion({
          ...basePromotion.toObject(),
          _id: undefined,
          code: uniqueCode,
          name: `${basePromotion.name} - ${uniqueCode}`,
          createdAt: undefined,
          updatedAt: undefined,
        });

        await newPromotion.save();
        codes.push(uniqueCode);
      }

      console.log(`✅ Generated ${count} bulk promotion codes`);
      return codes;
    } catch (error) {
      console.error("❌ Error generating bulk codes:", error);
      throw error;
    }
  }

  // Get promotion analytics
  async getPromotionAnalytics(promotionId, startDate, endDate) {
    try {
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) return null;

      // Get orders that used this promotion
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        "appliedPromotions.promotionId": promotionId,
      });

      const analytics = {
        totalUses: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        totalSavings: orders.reduce((sum, order) => {
          const promoData = order.appliedPromotions.find(
            (p) => p.promotionId.toString() === promotionId
          );
          return sum + (promoData?.discountAmount || 0);
        }, 0),
        averageOrderValue:
          orders.length > 0
            ? orders.reduce((sum, order) => sum + order.totalAmount, 0) /
              orders.length
            : 0,
        uniqueUsers: [
          ...new Set(orders.map((order) => order.userId.toString())),
        ].length,
        conversionRate: 0, // Would need impression data
      };

      return {
        promotion: {
          id: promotion._id,
          name: promotion.name,
          code: promotion.code,
          type: promotion.type,
        },
        analytics,
        timeRange: { startDate, endDate },
      };
    } catch (error) {
      console.error("❌ Error getting promotion analytics:", error);
      return null;
    }
  }

  // Optimize promotion performance
  async optimizePromotions() {
    try {
      console.log("🔧 Starting promotion optimization...");

      // Disable expired promotions
      const expiredPromotions = await Promotion.updateMany(
        {
          "validity.endDate": { $lt: new Date() },
          status: "active",
        },
        { status: "expired" }
      );

      // Disable promotions that exceeded usage limit
      const overusedPromotions = await Promotion.updateMany(
        {
          $expr: { $gte: ["$usageLimit.currentUsage", "$usageLimit.total"] },
          status: "active",
        },
        { status: "disabled" }
      );

      console.log(
        `✅ Optimization complete: ${expiredPromotions.modifiedCount} expired, ${overusedPromotions.modifiedCount} overused`
      );

      return {
        expiredCount: expiredPromotions.modifiedCount,
        overusedCount: overusedPromotions.modifiedCount,
      };
    } catch (error) {
      console.error("❌ Error optimizing promotions:", error);
      throw error;
    }
  }
}

module.exports = new PromotionService();
