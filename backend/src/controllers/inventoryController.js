const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const notificationService = require("../services/notificationService");

class InventoryController {
  // Get inventory overview
  async getInventoryOverview(req, res) {
    try {
      console.log("📦 Fetching inventory overview");

      const [
        totalProducts,
        activeProducts,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
        topSellingProducts,
        categoryWiseStock,
      ] = await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({
          isActive: true,
          $expr: { $lte: ["$stock", "$lowStockThreshold"] },
          stock: { $gt: 0 },
        }),
        Product.countDocuments({ isActive: true, stock: 0 }),
        Product.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$stock", "$costPrice"] } },
            },
          },
        ]),
        this.getTopSellingProducts(),
        this.getCategoryWiseStock(),
      ]);

      res.status(200).json({
        status: "success",
        data: {
          summary: {
            totalProducts,
            activeProducts,
            lowStockCount,
            outOfStockCount,
            totalStockValue: totalStockValue[0]?.total || 0,
          },
          topSellingProducts,
          categoryWiseStock,
        },
      });
    } catch (error) {
      console.error("❌ Inventory overview error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch inventory overview",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        sortBy = "stock",
        sortOrder = "asc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      let query = {
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      };

      if (category) query.category = category;

      const [products, totalProducts] = await Promise.all([
        Product.find(query)
          .populate("category", "name")
          .select(
            "name sku stock lowStockThreshold price costPrice category images"
          )
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip),
        Product.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      res.status(200).json({
        status: "success",
        data: {
          products: products.map((product) => ({
            ...product.toObject(),
            stockStatus: product.stock === 0 ? "out_of_stock" : "low_stock",
            daysUntilOutOfStock: this.calculateDaysUntilOutOfStock(product),
            reorderRecommendation: this.calculateReorderQuantity(product),
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get low stock products error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch low stock products",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update product stock
  async updateProductStock(req, res) {
    try {
      const { productId } = req.params;
      const { stock, operation = "set", reason, notes } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      const previousStock = product.stock;

      // Update stock based on operation
      switch (operation) {
        case "set":
          product.stock = stock;
          break;
        case "add":
          product.stock += stock;
          break;
        case "subtract":
          product.stock = Math.max(0, product.stock - stock);
          break;
        default:
          return res.status(400).json({
            status: "error",
            message: 'Invalid operation. Use "set", "add", or "subtract"',
            code: "INVALID_OPERATION",
          });
      }

      await product.save();

      // Log stock movement
      await this.logStockMovement({
        productId: product._id,
        previousStock,
        newStock: product.stock,
        change: product.stock - previousStock,
        operation,
        reason: reason || "Manual adjustment",
        notes,
        updatedBy: req.user._id,
      });

      // Check for low stock alert
      if (
        product.stock <= product.lowStockThreshold &&
        previousStock > product.lowStockThreshold
      ) {
        await this.sendLowStockAlert(product);
      }

      console.log(
        `✅ Stock updated for ${product.name}: ${previousStock} → ${product.stock}`
      );

      res.status(200).json({
        status: "success",
        message: "Stock updated successfully",
        data: {
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            previousStock,
            newStock: product.stock,
            change: product.stock - previousStock,
          },
        },
      });
    } catch (error) {
      console.error("❌ Update stock error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update stock",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Bulk stock update
  async bulkUpdateStock(req, res) {
    try {
      const { updates } = req.body; // Array of { productId, stock, operation, reason }

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Updates array is required",
          code: "INVALID_INPUT",
        });
      }

      if (updates.length > 100) {
        return res.status(400).json({
          status: "error",
          message: "Maximum 100 products can be updated at once",
          code: "LIMIT_EXCEEDED",
        });
      }

      const results = [];
      const failures = [];

      for (const update of updates) {
        try {
          const { productId, stock, operation = "set", reason } = update;

          const product = await Product.findById(productId);
          if (!product) {
            failures.push({
              productId,
              error: "Product not found",
            });
            continue;
          }

          const previousStock = product.stock;

          switch (operation) {
            case "set":
              product.stock = stock;
              break;
            case "add":
              product.stock += stock;
              break;
            case "subtract":
              product.stock = Math.max(0, product.stock - stock);
              break;
          }

          await product.save();

          await this.logStockMovement({
            productId: product._id,
            previousStock,
            newStock: product.stock,
            change: product.stock - previousStock,
            operation,
            reason: reason || "Bulk update",
            updatedBy: req.user._id,
          });

          results.push({
            productId: product._id,
            name: product.name,
            sku: product.sku,
            previousStock,
            newStock: product.stock,
            change: product.stock - previousStock,
          });

          // Check for low stock alert
          if (
            product.stock <= product.lowStockThreshold &&
            previousStock > product.lowStockThreshold
          ) {
            await this.sendLowStockAlert(product);
          }
        } catch (error) {
          failures.push({
            productId: update.productId,
            error: error.message,
          });
        }
      }

      console.log(
        `✅ Bulk stock update completed: ${results.length} success, ${failures.length} failed`
      );

      res.status(200).json({
        status: "success",
        message: `Bulk update completed: ${results.length} updated, ${failures.length} failed`,
        data: {
          updated: results,
          failed: failures,
          summary: {
            totalRequested: updates.length,
            successCount: results.length,
            failureCount: failures.length,
          },
        },
      });
    } catch (error) {
      console.error("❌ Bulk stock update error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to perform bulk stock update",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get stock movement history
  async getStockMovements(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        productId,
        startDate,
        endDate,
        operation,
      } = req.query;

      // This would require a StockMovement model
      // For now, returning mock data
      res.status(200).json({
        status: "success",
        data: {
          movements: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalMovements: 0,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get stock movements error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch stock movements",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Generate stock report
  async generateStockReport(req, res) {
    try {
      const { format = "json", category, stockStatus } = req.query;

      let query = { isActive: true };

      if (category) query.category = category;

      if (stockStatus) {
        switch (stockStatus) {
          case "low_stock":
            query.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
            query.stock = { $gt: 0 };
            break;
          case "out_of_stock":
            query.stock = 0;
            break;
          case "in_stock":
            query.$expr = { $gt: ["$stock", "$lowStockThreshold"] };
            break;
        }
      }

      const products = await Product.find(query)
        .populate("category", "name")
        .select("name sku stock lowStockThreshold price costPrice category")
        .sort({ name: 1 });

      const report = {
        generatedAt: new Date(),
        totalProducts: products.length,
        filters: { category, stockStatus },
        products: products.map((product) => ({
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "Uncategorized",
          currentStock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          stockStatus: this.getStockStatus(product),
          price: product.price,
          stockValue: product.stock * product.costPrice,
          reorderRecommendation: this.calculateReorderQuantity(product),
        })),
      };

      if (format === "csv") {
        // Convert to CSV format
        const csv = this.convertToCSV(report.products);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=stock-report.csv"
        );
        res.send(csv);
      } else {
        res.status(200).json({
          status: "success",
          data: report,
        });
      }
    } catch (error) {
      console.error("❌ Generate stock report error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to generate stock report",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Set reorder points
  async setReorderPoints(req, res) {
    try {
      const { reorderPoints } = req.body; // Array of { productId, threshold }

      if (!Array.isArray(reorderPoints)) {
        return res.status(400).json({
          status: "error",
          message: "Reorder points array is required",
          code: "INVALID_INPUT",
        });
      }

      const results = [];

      for (const point of reorderPoints) {
        try {
          const { productId, threshold } = point;

          await Product.findByIdAndUpdate(
            productId,
            { lowStockThreshold: threshold },
            { new: true }
          );

          results.push({
            productId,
            newThreshold: threshold,
            success: true,
          });
        } catch (error) {
          results.push({
            productId: point.productId,
            error: error.message,
            success: false,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      console.log(
        `✅ Reorder points updated: ${successCount}/${reorderPoints.length} products`
      );

      res.status(200).json({
        status: "success",
        message: `Reorder points updated for ${successCount} products`,
        data: {
          results,
          summary: {
            total: reorderPoints.length,
            success: successCount,
            failed: reorderPoints.length - successCount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Set reorder points error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to set reorder points",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Helper methods
  async getTopSellingProducts() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            "payment.status": "completed",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]);
    } catch (error) {
      console.error("❌ Error getting top selling products:", error);
      return [];
    }
  }

  async getCategoryWiseStock() {
    try {
      return await Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$category",
            categoryName: { $first: "$categoryInfo.name" },
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            lowStockProducts: {
              $sum: {
                $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0],
              },
            },
            stockValue: {
              $sum: { $multiply: ["$stock", "$costPrice"] },
            },
          },
        },
        { $sort: { totalStock: -1 } },
      ]);
    } catch (error) {
      console.error("❌ Error getting category wise stock:", error);
      return [];
    }
  }

  calculateDaysUntilOutOfStock(product) {
    // Simple calculation based on average daily sales
    // In production, this would use historical sales data
    const avgDailySales = product.salesMetrics?.totalSold / 30 || 1;
    return Math.floor(product.stock / avgDailySales);
  }

  calculateReorderQuantity(product) {
    // Simple reorder calculation
    const avgDailySales = product.salesMetrics?.totalSold / 30 || 1;
    const leadTimeDays = 7; // Assume 7 days lead time
    const safetyStock = avgDailySales * 3; // 3 days safety stock

    return Math.ceil(avgDailySales * leadTimeDays + safetyStock);
  }

  getStockStatus(product) {
    if (product.stock === 0) return "out_of_stock";
    if (product.stock <= product.lowStockThreshold) return "low_stock";
    return "in_stock";
  }

  async logStockMovement(movementData) {
    // This would save to a StockMovement collection
    console.log("📝 Stock movement logged:", movementData);
  }

  async sendLowStockAlert(product) {
    try {
      await notificationService.sendAutomatedNotification(
        "low_stock_alert",
        product._id,
        {
          productName: product.name,
          currentStock: product.stock,
          threshold: product.lowStockThreshold,
          sku: product.sku,
        }
      );
    } catch (error) {
      console.error("❌ Error sending low stock alert:", error);
    }
  }

  convertToCSV(data) {
    if (!data.length) return "";

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));

    return [headers, ...rows].join("\n");
  }
}

module.exports = new InventoryController();
