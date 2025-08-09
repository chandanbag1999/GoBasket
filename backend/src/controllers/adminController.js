const analyticsService = require("../services/analyticsService");
const promotionService = require("../services/promotionService");
const notificationService = require("../services/notificationService");
const {
  DailyAnalytics,
  UserAnalytics,
  ProductAnalytics,
} = require("../models/Analytics");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Promotion = require("../models/Promotion");

class AdminController {
  // Get dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const { days = 30 } = req.query;

      console.log(`📊 Fetching dashboard overview for ${days} days`);

      const dashboardData = await analyticsService.getDashboardSummary(
        parseInt(days)
      );

      // Get real-time metrics
      const realtimeMetrics = await this.getRealtimeMetrics();

      // Get recent activities
      const recentActivities = await this.getRecentActivities();

      res.status(200).json({
        status: "success",
        data: {
          ...dashboardData,
          realtime: realtimeMetrics,
          recentActivities,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      console.error("❌ Dashboard overview error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch dashboard data",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get sales analytics
  async getSalesAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        groupBy = "day",
        category,
        paymentMethod,
      } = req.query;

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      console.log(
        `📈 Fetching sales analytics from ${start.toDateString()} to ${end.toDateString()}`
      );

      // Get daily analytics data
      const analytics = await DailyAnalytics.find({
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 });

      // Process data for charts
      const chartData = this.processAnalyticsForCharts(analytics, groupBy);

      // Get category breakdown
      const categoryBreakdown = await this.getCategoryBreakdown(start, end);

      // Get payment method breakdown
      const paymentBreakdown = await this.getPaymentMethodBreakdown(start, end);

      // Get top products
      const topProducts = await this.getTopProducts(start, end);

      res.status(200).json({
        status: "success",
        data: {
          chartData,
          categoryBreakdown,
          paymentBreakdown,
          topProducts,
          summary: {
            totalRevenue: analytics.reduce(
              (sum, a) => sum + a.metrics.totalRevenue,
              0
            ),
            totalOrders: analytics.reduce(
              (sum, a) => sum + a.metrics.totalOrders,
              0
            ),
            averageOrderValue: chartData.averageOrderValue || 0,
          },
          dateRange: { startDate: start, endDate: end },
        },
      });
    } catch (error) {
      console.error("❌ Sales analytics error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch sales analytics",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get user analytics
  async getUserAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      console.log(`👥 Fetching user analytics for ${days} days`);

      // Get user analytics
      const userAnalytics = await UserAnalytics.find({
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 });

      // Get user growth data
      const userGrowth = await this.getUserGrowthData(startDate, endDate);

      // Get user segments
      const userSegments = await this.getUserSegments();

      // Get user engagement metrics
      const engagementMetrics = await this.getUserEngagementMetrics(
        startDate,
        endDate
      );

      res.status(200).json({
        status: "success",
        data: {
          analytics: userAnalytics,
          growth: userGrowth,
          segments: userSegments,
          engagement: engagementMetrics,
          summary: {
            totalUsers: await User.countDocuments({ deletedAt: null }),
            activeUsers:
              userAnalytics[userAnalytics.length - 1]?.metrics.activeUsers || 0,
            newUsers: userAnalytics.reduce(
              (sum, a) => sum + a.metrics.newRegistrations,
              0
            ),
          },
        },
      });
    } catch (error) {
      console.error("❌ User analytics error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch user analytics",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics(req, res) {
    try {
      console.log("📦 Fetching inventory analytics");

      // Get inventory summary
      const inventorySummary = await this.getInventorySummary();

      // Get low stock products
      const lowStockProducts = await Product.find({
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      })
        .select("name stock lowStockThreshold category sku")
        .populate("category", "name")
        .limit(20);

      // Get out of stock products
      const outOfStockProducts = await Product.find({
        isActive: true,
        stock: 0,
      })
        .select("name category sku")
        .populate("category", "name")
        .limit(20);

      // Get category-wise stock value
      const categoryStockValue = await this.getCategoryStockValue();

      // Get stock movement trends
      const stockMovements = await this.getStockMovements();

      res.status(200).json({
        status: "success",
        data: {
          summary: inventorySummary,
          lowStockProducts,
          outOfStockProducts,
          categoryStockValue,
          stockMovements,
        },
      });
    } catch (error) {
      console.error("❌ Inventory analytics error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch inventory analytics",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get recent activities
  async getRecentActivities() {
    try {
      const activities = [];

      // Recent orders
      const recentOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "firstName lastName email")
        .select("orderNumber totalAmount status createdAt userId");

      recentOrders.forEach((order) => {
        activities.push({
          type: "order",
          icon: "🛒",
          title: `New order ${order.orderNumber}`,
          description: `₹${order.totalAmount} by ${order.userId.firstName} ${order.userId.lastName}`,
          timestamp: order.createdAt,
          status: order.status,
        });
      });

      // Recent users
      const recentUsers = await User.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("firstName lastName email createdAt");

      recentUsers.forEach((user) => {
        activities.push({
          type: "user",
          icon: "👤",
          title: "New user registered",
          description: `${user.firstName} ${user.lastName} (${user.email})`,
          timestamp: user.createdAt,
          status: "completed",
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, 10);
    } catch (error) {
      console.error("❌ Error getting recent activities:", error);
      return [];
    }
  }

  // Get realtime metrics
  async getRealtimeMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayOrders, todayRevenue, onlineUsers, pendingOrders] =
        await Promise.all([
          Order.countDocuments({
            createdAt: { $gte: today },
          }),

          Order.aggregate([
            {
              $match: {
                createdAt: { $gte: today },
                "payment.status": "completed",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" },
              },
            },
          ]),

          // This would require session tracking
          0,

          Order.countDocuments({
            status: { $in: ["pending", "confirmed"] },
          }),
        ]);

      return {
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        onlineUsers,
        pendingOrders,
      };
    } catch (error) {
      console.error("❌ Error getting realtime metrics:", error);
      return {
        todayOrders: 0,
        todayRevenue: 0,
        onlineUsers: 0,
        pendingOrders: 0,
      };
    }
  }

  // Process analytics data for charts
  processAnalyticsForCharts(analytics, groupBy) {
    const labels = [];
    const revenue = [];
    const orders = [];
    const customers = [];

    analytics.forEach((day) => {
      labels.push(day.date.toLocaleDateString());
      revenue.push(day.metrics.totalRevenue);
      orders.push(day.metrics.totalOrders);
      customers.push(day.metrics.newCustomers);
    });

    const totalRevenue = revenue.reduce((sum, val) => sum + val, 0);
    const totalOrders = orders.reduce((sum, val) => sum + val, 0);

    return {
      labels,
      datasets: {
        revenue,
        orders,
        customers,
      },
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    };
  }

  // Get category breakdown
  async getCategoryBreakdown(startDate, endDate) {
    try {
      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            "payment.status": "completed",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category._id",
            name: { $first: "$category.name" },
            revenue: { $sum: "$items.subtotal" },
            orders: { $sum: 1 },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ]);
    } catch (error) {
      console.error("❌ Error getting category breakdown:", error);
      return [];
    }
  }

  // Get payment method breakdown
  async getPaymentMethodBreakdown(startDate, endDate) {
    try {
      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            "payment.status": "completed",
          },
        },
        {
          $group: {
            _id: "$payment.method",
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error getting payment method breakdown:", error);
      return [];
    }
  }

  // Get top products
  async getTopProducts(startDate, endDate, limit = 10) {
    try {
      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            "payment.status": "completed",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
      ]);
    } catch (error) {
      console.error("❌ Error getting top products:", error);
      return [];
    }
  }

  // Additional helper methods would go here...
  // (getUserGrowthData, getUserSegments, getInventorySummary, etc.)
}

module.exports = new AdminController();
