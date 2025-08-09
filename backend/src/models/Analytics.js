const mongoose = require("mongoose");

// Daily analytics aggregation
const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalCustomers: { type: Number, default: 0 },
      newCustomers: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      returnedOrders: { type: Number, default: 0 },
    },

    // Sales breakdown
    salesByCategory: [
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryName: String,
        revenue: Number,
        orderCount: Number,
        productsSold: Number,
      },
    ],

    // Payment methods breakdown
    paymentMethods: {
      razorpay: { orders: Number, amount: Number },
      cod: { orders: Number, amount: Number },
      wallet: { orders: Number, amount: Number },
    },

    // Geographic data
    topCities: [
      {
        city: String,
        orderCount: Number,
        revenue: Number,
      },
    ],

    // Hourly distribution
    hourlyDistribution: [
      {
        hour: Number, // 0-23
        orders: Number,
        revenue: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// User behavior analytics
const userAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    metrics: {
      totalUsers: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
      newRegistrations: { type: Number, default: 0 },
      deletedAccounts: { type: Number, default: 0 },
      averageSessionDuration: { type: Number, default: 0 },
      bounceRate: { type: Number, default: 0 },
      repeatCustomers: { type: Number, default: 0 },
    },

    userSegments: {
      firstTime: { count: Number, revenue: Number },
      returning: { count: Number, revenue: Number },
      vip: { count: Number, revenue: Number },
    },

    deviceBreakdown: {
      mobile: { count: Number, percentage: Number },
      desktop: { count: Number, percentage: Number },
      tablet: { count: Number, percentage: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Product performance analytics
const productAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },

    topProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        quantitySold: Number,
        revenue: Number,
        views: Number,
        conversionRate: Number,
      },
    ],

    lowStockProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        currentStock: Number,
        threshold: Number,
        daysUntilOutOfStock: Number,
      },
    ],

    categoryPerformance: [
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryName: String,
        productsCount: Number,
        totalViews: Number,
        totalSales: Number,
        averageRating: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
dailyAnalyticsSchema.index({ date: -1 });
userAnalyticsSchema.index({ date: -1 });
productAnalyticsSchema.index({ date: -1 });

module.exports = {
  DailyAnalytics: mongoose.model("DailyAnalytics", dailyAnalyticsSchema),
  UserAnalytics: mongoose.model("UserAnalytics", userAnalyticsSchema),
  ProductAnalytics: mongoose.model("ProductAnalytics", productAnalyticsSchema),
};
