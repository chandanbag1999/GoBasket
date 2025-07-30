const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// Generic cache middleware
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.method}:${req.originalUrl}`;

      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        logger.info('Cache hit', {
          key: cacheKey,
          method: req.method,
          url: req.originalUrl
        });

        return res.status(200).json({
          ...cachedData,
          cached: true,
          cacheKey
        });
      }

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache successful responses
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          redisClient.set(cacheKey, data, duration).catch(error => {
            logger.error('Cache set error:', error);
          });

          logger.info('Data cached', {
            key: cacheKey,
            duration,
            method: req.method,
            url: req.originalUrl
          });
        }

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching
    }
  };
};

// Specific cache middleware for different endpoints
const cacheStrategies = {
  // Cache categories for 1 hour
  categories: cacheMiddleware(3600, (req) => 'cache:categories:all'),

  // Cache products for 30 minutes
  products: cacheMiddleware(1800, (req) => {
    const { category, restaurant, page = 1, limit = 12 } = req.query;
    return `cache:products:${category || 'all'}:${restaurant || 'all'}:${page}:${limit}`;
  }),

  // Cache featured products for 15 minutes
  featuredProducts: cacheMiddleware(900, () => 'cache:products:featured'),

  // Cache restaurant analytics for 5 minutes
  restaurantAnalytics: cacheMiddleware(300, (req) => 
    `cache:analytics:restaurant:${req.user._id}`
  ),

  // Cache user profile for 10 minutes
  userProfile: cacheMiddleware(600, (req) => 
    `cache:user:profile:${req.user._id}`
  ),

  // Cache dashboard stats for 2 minutes (frequently updated)
  dashboardStats: cacheMiddleware(120, () => 'cache:dashboard:stats')
};

// Cache invalidation helpers
const cacheInvalidation = {
  // Invalidate product-related caches
  invalidateProducts: async (patterns = []) => {
    try {
      const defaultPatterns = [
        'cache:products:*',
        'cache:products:featured',
        'cache:dashboard:stats'
      ];
      
      const allPatterns = [...defaultPatterns, ...patterns];
      
      for (const pattern of allPatterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.info('Cache invalidated', { pattern, keysCount: keys.length });
        }
      }
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  },

  // Invalidate user-related caches
  invalidateUser: async (userId) => {
    try {
      const patterns = [
        `cache:user:profile:${userId}`,
        'cache:analytics:users',
        'cache:dashboard:stats'
      ];

      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      logger.info('User cache invalidated', { userId });
    } catch (error) {
      logger.error('User cache invalidation error:', error);
    }
  },

  // Invalidate analytics caches
  invalidateAnalytics: async () => {
    try {
      const patterns = [
        'cache:dashboard:stats',
        'cache:analytics:*',
        'cache:restaurant:analytics:*'
      ];

      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      logger.info('Analytics cache invalidated');
    } catch (error) {
      logger.error('Analytics cache invalidation error:', error);
    }
  },

  // Clear all cache
  clearAllCache: async () => {
    try {
      const keys = await redisClient.keys('cache:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info('All cache cleared', { keysCount: keys.length });
      }
    } catch (error) {
      logger.error('Clear all cache error:', error);
    }
  }
};

// Cache warming - pre-populate frequently accessed data
const cacheWarming = {
  // Warm up categories cache
  warmCategories: async () => {
    try {
      const Category = require('../models/Category');
      const categories = await Category.getHierarchy();
      await redisClient.set('cache:categories:all', {
        success: true,
        count: categories.length,
        data: { categories }
      }, 3600);
      
      logger.info('Categories cache warmed');
    } catch (error) {
      logger.error('Categories cache warming error:', error);
    }
  },

  // Warm up featured products cache
  warmFeaturedProducts: async () => {
    try {
      const Product = require('../models/Product');
      const products = await Product.getFeatured(10);
      await redisClient.set('cache:products:featured', {
        success: true,
        count: products.length,
        data: { products }
      }, 900);
      
      logger.info('Featured products cache warmed');
    } catch (error) {
      logger.error('Featured products cache warming error:', error);
    }
  },

  // Warm all essential caches
  warmAllCaches: async () => {
    logger.info('Starting cache warming...');
    await Promise.all([
      cacheWarming.warmCategories(),
      cacheWarming.warmFeaturedProducts()
    ]);
    logger.info('Cache warming completed');
  }
};

module.exports = {
  cacheMiddleware,
  cacheStrategies,
  cacheWarming
};

