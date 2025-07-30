const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

// Get dashboard overview stats (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const cacheKey = 'dashboard_stats';
    
    // Try to get from cache first
    const cachedStats = await redisClient.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        data: cachedStats,
        cached: true
      });
    }

    // Calculate date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Parallel queries for better performance
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      todayOrders,
      monthlyOrders,
      lastMonthOrders,
      totalRevenue,
      monthlyRevenue,
      activeOrders,
      topProducts
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isActive: true }),
      
      // Total restaurants
      User.countDocuments({ role: 'restaurant-owner', isActive: true }),
      
      // Total orders
      Order.countDocuments(),
      
      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: startOfToday }
      }),
      
      // This month's orders
      Order.countDocuments({
        createdAt: { $gte: startOfMonth }
      }),
      
      // Last month's orders
      Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      
      // Total revenue
      Order.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      
      // Monthly revenue
      Order.aggregate([
        { 
          $match: { 
            'payment.status': 'completed',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      
      // Active orders (not delivered/cancelled)
      Order.countDocuments({
        status: { $nin: ['delivered', 'cancelled', 'refunded'] }
      }),
      
      // Top selling products
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.totalPrice' },
            productName: { $first: '$items.productSnapshot.name' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Calculate growth percentages
    const orderGrowth = lastMonthOrders > 0 
      ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 0;

    const dashboardStats = {
      overview: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        activeOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      todayStats: {
        orders: todayOrders,
        revenue: 0 // Could calculate today's revenue similarly
      },
      monthlyStats: {
        orders: monthlyOrders,
        lastMonthOrders,
        orderGrowth: parseFloat(orderGrowth),
        revenue: monthlyRevenue[0]?.total || 0
      },
      topProducts: topProducts.map(product => ({
        name: product.productName,
        quantity: product.totalQuantity,
        revenue: product.totalRevenue
      }))
    };

    // Cache for 10 minutes
    await redisClient.set(cacheKey, dashboardStats, 600);

    logger.info('Dashboard stats generated', {
      adminId: req.user._id,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });

    res.status(200).json({
      success: true,
      data: dashboardStats,
      cached: false
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching dashboard stats'
    });
  }
};

// Get order analytics (Admin)
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Group by time period
    let groupId;
    if (groupBy === 'hour') {
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' }
      };
    } else if (groupBy === 'day') {
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (groupBy === 'month') {
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const orderAnalytics = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'completed'] },
                '$pricing.total',
                0
              ]
            }
          },
          averageOrderValue: { $avg: '$pricing.total' },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      { 
        $match: { 
          ...matchQuery,
          'payment.status': 'completed'
        } 
      },
      {
        $group: {
          _id: '$payment.paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeSeriesData: orderAnalytics,
        statusDistribution,
        paymentMethods,
        totalDataPoints: orderAnalytics.length
      }
    });

  } catch (error) {
    logger.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching order analytics'
    });
  }
};

// Get restaurant performance analytics (Admin)
exports.getRestaurantAnalytics = async (req, res) => {
  try {
    const { limit = 10, sortBy = 'revenue' } = req.query;

    const restaurantStats = await Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      {
        $group: {
          _id: '$restaurant',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $project: {
          restaurantId: '$_id',
          restaurantName: { $arrayElemAt: ['$restaurantInfo.name', 0] },
          totalOrders: 1,
          totalRevenue: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          deliveredOrders: 1,
          cancelledOrders: 1,
          successRate: {
            $round: [
              { $multiply: [{ $divide: ['$deliveredOrders', '$totalOrders'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { [sortBy]: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: {
        restaurants: restaurantStats,
        count: restaurantStats.length
      }
    });

  } catch (error) {
    logger.error('Get restaurant analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching restaurant analytics'
    });
  }
};

// Get user analytics (Admin)
exports.getUserAnalytics = async (req, res) => {
  try {
    const cacheKey = 'user_analytics';
    
    // Try cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // User registrations over time
    const userRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 } // Last 30 days
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most active users (by order count)
    const activeUsers = await Order.aggregate([
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: { $arrayElemAt: ['$userInfo.name', 0] },
          userEmail: { $arrayElemAt: ['$userInfo.email', 0] },
          orderCount: 1,
          totalSpent: 1,
          averageOrderValue: { $round: ['$averageOrderValue', 2] }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    const userAnalytics = {
      registrations: userRegistrations,
      roleDistribution,
      activeUsers,
      totalStats: {
        totalUsers: await User.countDocuments({ isActive: true }),
        newUsersToday: await User.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      }
    };

    // Cache for 15 minutes
    await redisClient.set(cacheKey, userAnalytics, 900);

    res.status(200).json({
      success: true,
      data: userAnalytics,
      cached: false
    });

  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching user analytics'
    });
  }
};


