const cacheService = require("../services/cacheService");

class CacheMiddleware {
  // Generic cache middleware
  static cache(keyGenerator, ttl = 300, condition = null) {
    return async (req, res, next) => {
      try {
        // Skip caching if condition returns false
        if (condition && !condition(req)) {
          return next();
        }

        // Generate cache key
        const cacheKey =
          typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

        // Try to get from cache
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
          console.log(`⚡ Serving from cache: ${cacheKey}`);
          return res.status(200).json(cachedData);
        }

        // Store original res.json method
        const originalJson = res.json;

        // Override res.json to cache the response
        res.json = function (data) {
          // Only cache successful responses
          if (res.statusCode === 200 && data.status === "success") {
            cacheService.set(cacheKey, data, ttl);
          }

          // Call original json method
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error("❌ Cache middleware error:", error);
        next();
      }
    };
  }

  // Cart cache middleware - THIS IS THE MISSING FUNCTION!
  static cacheCart(ttl = 60) {
    return this.cache((req) => {
      return `cart:${req.user._id}`;
    }, ttl);
  }

  // Product-specific cache middleware
  static cacheProducts(ttl = 300) {
    return this.cache((req) => {
      const { page = 1, limit = 20, category, search, ...filters } = req.query;
      return cacheService.generateProductKey("list", {
        page,
        limit,
        category,
        search,
        ...filters,
      });
    }, ttl);
  }

  // Single product cache middleware
  static cacheProduct(ttl = 1800) {
    return this.cache((req) => {
      return cacheService.generateProductKey(req.params.identifier);
    }, ttl);
  }

  // Search results cache middleware
  static cacheSearchResults(ttl = 300) {
    return this.cache((req) => {
      const { q, ...filters } = req.query;
      return cacheService.generateSearchKey(q, filters);
    }, ttl);
  }

  // Category cache middleware
  static cacheCategories(ttl = 3600) {
    return this.cache((req) => {
      const { level, includeProductCount } = req.query;
      return `categories:list:level=${level || "all"}:count=${
        includeProductCount || "false"
      }`;
    }, ttl);
  }

  // User-specific cache middleware
  static cacheUserData(dataType, ttl = 300) {
    return this.cache((req) => {
      return `users:${req.user._id}:${dataType}`;
    }, ttl);
  }

  // Analytics cache middleware
  static cacheAnalytics(analyticsType, ttl = 3600) {
    return this.cache((req) => {
      const { startDate, endDate, ...params } = req.query;
      const paramString = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      return `analytics:${analyticsType}:${startDate || "default"}:${
        endDate || "default"
      }:${paramString}`;
    }, ttl);
  }

  // Cache invalidation middleware
  static invalidateCache(patterns) {
    return async (req, res, next) => {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;

      const invalidate = async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            const actualPattern =
              typeof pattern === "function" ? pattern(req) : pattern;
            await cacheService.delPattern(actualPattern);
          }
        }
      };

      // Override response methods to trigger invalidation
      res.json = function (data) {
        invalidate();
        return originalJson.call(this, data);
      };

      res.send = function (data) {
        invalidate();
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

module.exports = CacheMiddleware;
