const {
  DailyAnalytics,
  UserAnalytics,
  ProductAnalytics,
} = require("../models/Analytics");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");

class AnalyticsService {
  // Generate daily analytics aggregation
  async generateDailyAnalytics(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`📊 Generating analytics for ${date.toDateString()}`);

      // Parallel aggregation queries
      const [
        orderStats,
        salesByCategory,
        paymentMethodStats,
        topCities,
        hourlyDistribution,
        userStats,
        productStats,
      ] = await Promise.all([
        this.getOrderStats(startOfDay, endOfDay),
        this.getSalesByCategory(startOfDay, endOfDay),
        this.getPaymentMethodStats(startOfDay, endOfDay),
        this.getTopCities(startOfDay, endOfDay),
        this.getHourlyDistribution(startOfDay, endOfDay),
        this.getUserStats(startOfDay, endOfDay),
        this.getProductStats(startOfDay, endOfDay),
      ]);

      // Update or create daily analytics
      const dailyAnalytics = await DailyAnalytics.findOneAndUpdate(
        { date: startOfDay },
        {
          date: startOfDay,
          metrics: orderStats,
          salesByCategory,
          paymentMethods: paymentMethodStats,
          topCities,
          hourlyDistribution,
        },
        { upsert: true, new: true }
      );

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { date: startOfDay },
        {
          date: startOfDay,
          metrics: userStats.metrics,
          userSegments: userStats.segments,
          deviceBreakdown: userStats.devices,
        },
        { upsert: true, new: true }
      );

      // Update product analytics
      await ProductAnalytics.findOneAndUpdate(
        { date: startOfDay },
        {
          date: startOfDay,
          topProducts: productStats.topProducts,
          lowStockProducts: productStats.lowStock,
          categoryPerformance: productStats.categories,
        },
        { upsert: true, new: true }
      );

      console.log(
        `✅ Analytics generated successfully for ${date.toDateString()}`
      );
      return dailyAnalytics;
    } catch (error) {
      console.error("❌ Error generating daily analytics:", error);
      throw error;
    }
  }

  // Get order statistics
  async getOrderStats(startOfDay, endOfDay) {
    const orderAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$payment.status", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
            },
          },
          returnedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "refunded"] }, 1, 0],
            },
          },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const stats = orderAggregation[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      averageOrderValue: 0,
    };

    // Get unique customers count
    const uniqueCustomers = await Order.distinct("userId", {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Get new customers count
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return {
      ...stats,
      totalCustomers: uniqueCustomers.length,
      newCustomers,
      conversionRate:
        uniqueCustomers.length > 0
          ? (stats.totalOrders / uniqueCustomers.length) * 100
          : 0,
    };
  }

  // Get sales by category
  async getSalesByCategory(startOfDay, endOfDay) {
    return await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
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
          categoryName: { $first: "$category.name" },
          revenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 },
          productsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);
  }

  // Get payment method statistics
  async getPaymentMethodStats(startOfDay, endOfDay) {
    const paymentStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          "payment.status": "completed",
        },
      },
      {
        $group: {
          _id: "$payment.method",
          orders: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const result = {
      razorpay: { orders: 0, amount: 0 },
      cod: { orders: 0, amount: 0 },
      wallet: { orders: 0, amount: 0 },
    };

    paymentStats.forEach((stat) => {
      if (result[stat._id]) {
        result[stat._id] = { orders: stat.orders, amount: stat.amount };
      }
    });

    return result;
  }

  // Get top cities by orders
  async getTopCities(startOfDay, endOfDay) {
    return await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          "payment.status": "completed",
        },
      },
      {
        $group: {
          _id: "$shippingAddress.city",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          city: "$_id",
          orderCount: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ]);
  }

  // Get hourly distribution
  async getHourlyDistribution(startOfDay, endOfDay) {
    const hourlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$payment.status", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing hours with 0
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyStats.find((h) => h._id === hour);
      result.push({
        hour,
        orders: hourData ? hourData.orders : 0,
        revenue: hourData ? hourData.revenue : 0,
      });
    }

    return result;
  }

  // Get user statistics
  async getUserStats(startOfDay, endOfDay) {
    const totalUsers = await User.countDocuments({
      deletedAt: null,
    });

    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const deletedAccounts = await User.countDocuments({
      deletedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Get active users (users who placed orders)
    const activeUserIds = await Order.distinct("userId", {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // User segments
    const firstTimeCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                createdAt: { $lt: startOfDay },
              },
            },
          ],
          as: "previousOrders",
        },
      },
      {
        $match: {
          previousOrders: { $size: 0 },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const firstTimeStats = firstTimeCustomers[0] || { count: 0, revenue: 0 };

    return {
      metrics: {
        totalUsers,
        activeUsers: activeUserIds.length,
        newRegistrations,
        deletedAccounts,
        averageSessionDuration: 0, // Would need session tracking
        bounceRate: 0, // Would need session tracking
        repeatCustomers: activeUserIds.length - firstTimeStats.count,
      },
      segments: {
        firstTime: firstTimeStats,
        returning: {
          count: activeUserIds.length - firstTimeStats.count,
          revenue: 0, // Calculate separately if needed
        },
        vip: { count: 0, revenue: 0 }, // Define VIP criteria
      },
      devices: {
        mobile: { count: 0, percentage: 0 },
        desktop: { count: 0, percentage: 0 },
        tablet: { count: 0, percentage: 0 },
      },
    };
  }

  // Get product statistics
  async getProductStats(startOfDay, endOfDay) {
    // Top products by sales
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          "payment.status": "completed",
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          productId: "$_id",
          name: 1,
          quantitySold: 1,
          revenue: 1,
          views: 0, // Would need view tracking
          conversionRate: 0, // Would need view tracking
          _id: 0,
        },
      },
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    })
      .select("name stock lowStockThreshold")
      .limit(10)
      .lean();

    const lowStock = lowStockProducts.map((product) => ({
      productId: product._id,
      name: product.name,
      currentStock: product.stock,
      threshold: product.lowStockThreshold,
      daysUntilOutOfStock: Math.max(1, Math.floor(product.stock / 10)), // Rough estimate
    }));

    // Category performance
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          categoryName: "$name",
          productsCount: { $size: "$products" },
          totalViews: { $sum: "$products.salesMetrics.views" },
          totalSales: { $sum: "$products.salesMetrics.totalSold" },
          averageRating: { $avg: "$products.ratings.average" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
    ]);

    return {
      topProducts,
      lowStock,
      categories: categories.map((cat) => ({
        categoryId: cat._id,
        categoryName: cat.categoryName,
        productsCount: cat.productsCount,
        totalViews: cat.totalViews || 0,
        totalSales: cat.totalSales || 0,
        averageRating: cat.averageRating || 0,
      })),
    };
  }

  // Get dashboard summary
  async getDashboardSummary(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [recentAnalytics, totalStats, growthMetrics] = await Promise.all([
        DailyAnalytics.find({
          date: { $gte: startDate, $lte: endDate },
        })
          .sort({ date: -1 })
          .limit(7),

        this.getTotalStats(),
        this.getGrowthMetrics(days),
      ]);

      return {
        totalStats,
        growthMetrics,
        recentTrends: this.calculateTrends(recentAnalytics),
        chartData: this.prepareChartData(recentAnalytics),
      };
    } catch (error) {
      console.error("❌ Error getting dashboard summary:", error);
      throw error;
    }
  }

  // Get total statistics
  async getTotalStats() {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      activeProducts,
      lowStockCount,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { "payment.status": "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ deletedAt: null }),
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
      activeProducts,
      lowStockCount,
    };
  }

  // Get growth metrics
  async getGrowthMetrics(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const [currentPeriod, previousPeriod] = await Promise.all([
      DailyAnalytics.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: "$metrics.totalOrders" },
            totalRevenue: { $sum: "$metrics.totalRevenue" },
            totalCustomers: { $sum: "$metrics.newCustomers" },
          },
        },
      ]),

      DailyAnalytics.aggregate([
        { $match: { date: { $gte: previousStartDate, $lt: startDate } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: "$metrics.totalOrders" },
            totalRevenue: { $sum: "$metrics.totalRevenue" },
            totalCustomers: { $sum: "$metrics.newCustomers" },
          },
        },
      ]),
    ]);

    const current = currentPeriod[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
    };
    const previous = previousPeriod[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
    };

    return {
      ordersGrowth: this.calculateGrowthPercentage(
        current.totalOrders,
        previous.totalOrders
      ),
      revenueGrowth: this.calculateGrowthPercentage(
        current.totalRevenue,
        previous.totalRevenue
      ),
      customersGrowth: this.calculateGrowthPercentage(
        current.totalCustomers,
        previous.totalCustomers
      ),
    };
  }

  // Calculate growth percentage
  calculateGrowthPercentage(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Calculate trends
  calculateTrends(analytics) {
    if (analytics.length < 2) return { trend: "stable", percentage: 0 };

    const latest = analytics[0];
    const previous = analytics[1];

    const revenueGrowth = this.calculateGrowthPercentage(
      latest.metrics.totalRevenue,
      previous.metrics.totalRevenue
    );

    return {
      trend: revenueGrowth > 5 ? "up" : revenueGrowth < -5 ? "down" : "stable",
      percentage: Math.abs(revenueGrowth),
    };
  }

  // Prepare chart data
  prepareChartData(analytics) {
    return {
      labels: analytics.reverse().map((a) => a.date.toLocaleDateString()),
      revenue: analytics.map((a) => a.metrics.totalRevenue),
      orders: analytics.map((a) => a.metrics.totalOrders),
      customers: analytics.map((a) => a.metrics.newCustomers),
    };
  }
}

module.exports = new AnalyticsService();
