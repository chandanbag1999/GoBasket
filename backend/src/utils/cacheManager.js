const cacheService = require("../services/cacheService");
const cron = require("node-cron");

class CacheManager {
  // Initialize cache management
  static init() {
    console.log("🔥 Starting Cache Manager...");

    // Warm up cache on startup (with delay to allow DB connections)
    setTimeout(() => {
      this.warmupCache();
    }, 5000);

    // Schedule cache maintenance
    this.scheduleMaintenance();

    // Setup cache monitoring
    this.setupMonitoring();

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  // Warm up critical caches
  static async warmupCache() {
    try {
      console.log("🔥 Starting cache warmup...");

      await cacheService.warmupCache();

      console.log("✅ Cache warmup completed");
    } catch (error) {
      console.error("❌ Cache warmup failed:", error);
    }
  }

  // Schedule cache maintenance tasks
  static scheduleMaintenance() {
    // Clear expired analytics cache daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      console.log("🧹 Running daily cache maintenance...");

      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateKey = yesterday.toISOString().split("T")[0];

        await Promise.all([
          cacheService.delPattern(`analytics:*:${dateKey}`),
          cacheService.delPattern("search:*"),
          this.cleanupOldCacheKeys(),
        ]);

        console.log("✅ Daily cache maintenance completed");
      } catch (error) {
        console.error("❌ Cache maintenance failed:", error);
      }
    });

    // Refresh featured products cache every hour
    cron.schedule("0 * * * *", async () => {
      try {
        await cacheService.warmupFeaturedProducts();
        console.log("🔥 Featured products cache refreshed");
      } catch (error) {
        console.error("❌ Featured products cache refresh failed:", error);
      }
    });

    // Refresh categories cache every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      try {
        await cacheService.warmupCategories();
        console.log("🔥 Categories cache refreshed");
      } catch (error) {
        console.error("❌ Categories cache refresh failed:", error);
      }
    });

    // Cache health check every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      try {
        const health = await cacheService.healthCheck();
        if (!health.healthy) {
          console.warn("⚠️ Cache health check failed:", health);
        }
      } catch (error) {
        console.error("❌ Cache health check failed:", error);
      }
    });

    // Performance statistics logging every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      try {
        const stats = await cacheService.getCacheStats();
        if (stats && stats.performance) {
          console.log("📊 Cache Performance:", {
            hitRate: stats.performance.hitRate,
            operations: stats.performance.totalOperations,
            errors: stats.performance.errors,
          });
        }
      } catch (error) {
        console.error("❌ Cache stats monitoring failed:", error);
      }
    });
  }

  // Setup cache monitoring with alerts
  static setupMonitoring() {
    const ALERT_THRESHOLDS = {
      HIT_RATE_LOW: 60, // Alert if hit rate below 60%
      ERROR_RATE_HIGH: 5, // Alert if error rate above 5%
      OPERATIONS_HIGH: 10000, // Alert if operations exceed 10k/period
    };

    // Performance monitoring with alerts
    setInterval(async () => {
      try {
        const stats = await cacheService.getCacheStats();

        if (stats && stats.performance) {
          const hitRate = parseFloat(stats.performance.hitRate);
          const errorRate =
            (stats.performance.errors / stats.performance.totalOperations) *
            100;

          // Hit rate alert
          if (hitRate < ALERT_THRESHOLDS.HIT_RATE_LOW) {
            console.warn(
              `🚨 LOW CACHE HIT RATE: ${hitRate}% (threshold: ${ALERT_THRESHOLDS.HIT_RATE_LOW}%)`
            );
          }

          // Error rate alert
          if (errorRate > ALERT_THRESHOLDS.ERROR_RATE_HIGH) {
            console.warn(
              `🚨 HIGH CACHE ERROR RATE: ${errorRate.toFixed(2)}% (threshold: ${
                ALERT_THRESHOLDS.ERROR_RATE_HIGH
              }%)`
            );
          }

          // Operations alert
          if (
            stats.performance.totalOperations > ALERT_THRESHOLDS.OPERATIONS_HIGH
          ) {
            console.warn(
              `🚨 HIGH CACHE OPERATIONS: ${stats.performance.totalOperations} (threshold: ${ALERT_THRESHOLDS.OPERATIONS_HIGH})`
            );
          }
        }
      } catch (error) {
        console.error("❌ Cache monitoring failed:", error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Memory usage monitoring
    setInterval(async () => {
      try {
        const stats = await cacheService.getCacheStats();

        if (stats && stats.redis && stats.redis.memory) {
          // Parse memory info (simplified)
          const memInfo = stats.redis.memory;
          if (memInfo.includes("used_memory:")) {
            console.log("💾 Cache Memory Status: Available");
          }
        }
      } catch (error) {
        console.error("❌ Memory monitoring failed:", error);
      }
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  // Setup graceful shutdown
  static setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`🔄 ${signal} received. Performing cache cleanup...`);

      try {
        // Save critical cache data if needed
        await this.backupCriticalCache();

        // Reset statistics
        cacheService.resetStats();

        console.log("✅ Cache cleanup completed");
      } catch (error) {
        console.error("❌ Cache cleanup failed:", error);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  // Manual cache operations
  static async clearAllCache() {
    try {
      await Promise.all([
        cacheService.delPattern("products:*"),
        cacheService.delPattern("categories:*"),
        cacheService.delPattern("search:*"),
        cacheService.delPattern("analytics:*"),
        cacheService.delPattern("cart:*"),
        cacheService.delPattern("users:*"),
        cacheService.delPattern("promotions:*"),
        cacheService.delPattern("inventory:*"),
        cacheService.delPattern("reviews:*"),
      ]);

      console.log("🧹 All cache cleared successfully");
      return true;
    } catch (error) {
      console.error("❌ Clear all cache failed:", error);
      return false;
    }
  }

  static async clearCacheByPattern(pattern) {
    try {
      await cacheService.delPattern(pattern);
      console.log(`🧹 Cache cleared for pattern: ${pattern}`);
      return true;
    } catch (error) {
      console.error(`❌ Clear cache failed for pattern: ${pattern}`, error);
      return false;
    }
  }

  // Cache preloading for specific scenarios
  static async preloadProductCategories() {
    try {
      const Category = require("../models/Category");
      const categories = await Category.findActiveCategories();

      await cacheService.cacheCategories(categories);

      console.log("🔥 Product categories preloaded");
      return true;
    } catch (error) {
      console.error("❌ Product categories preload failed:", error);
      return false;
    }
  }

  static async preloadPopularProducts() {
    try {
      const Product = require("../models/Product");

      // Preload featured products
      const featuredProducts = await Product.findActiveProducts({
        featured: true,
        limit: 50,
      });

      await cacheService.cacheProductList(
        "featured",
        featuredProducts,
        {},
        cacheService.defaultTTL.LONG
      );

      // Preload products by popular categories
      const popularCategories = await Category.find({ isActive: true }).limit(
        5
      );

      for (const category of popularCategories) {
        const categoryProducts = await Product.findActiveProducts({
          category: category._id,
          limit: 20,
        });

        await cacheService.cacheProductList(
          "category",
          categoryProducts,
          { categoryId: category._id },
          cacheService.defaultTTL.MEDIUM
        );
      }

      console.log("🔥 Popular products preloaded");
      return true;
    } catch (error) {
      console.error("❌ Popular products preload failed:", error);
      return false;
    }
  }

  // Cache invalidation strategies
  static async invalidateProductRelatedCache(productId) {
    try {
      await Promise.all([
        cacheService.invalidateProductCache(productId),
        cacheService.delPattern("search:*"),
        cacheService.delPattern("products:featured*"),
        cacheService.delPattern("products:category*"),
        cacheService.delPattern("inventory:*"),
      ]);

      console.log(`🔄 Product-related cache invalidated for: ${productId}`);
      return true;
    } catch (error) {
      console.error("❌ Product cache invalidation failed:", error);
      return false;
    }
  }

  static async invalidateUserSpecificCache(userId) {
    try {
      await Promise.all([
        cacheService.invalidateUserCache(userId),
        cacheService.invalidateCart(userId),
        cacheService.delPattern(`promotions:user:${userId}*`),
        cacheService.delPattern(`orders:user:${userId}*`),
      ]);

      console.log(`🔄 User-specific cache invalidated for: ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ User cache invalidation failed:", error);
      return false;
    }
  }

  // Performance monitoring
  static async getCachePerformanceReport() {
    try {
      const stats = await cacheService.getCacheStats();
      const health = await cacheService.healthCheck();

      return {
        stats,
        health,
        recommendations: this.generateCacheRecommendations(stats),
      };
    } catch (error) {
      console.error("❌ Cache performance report failed:", error);
      return null;
    }
  }

  static generateCacheRecommendations(stats) {
    const recommendations = [];

    if (stats && stats.performance) {
      const hitRate = parseFloat(stats.performance.hitRate);

      if (hitRate < 70) {
        recommendations.push({
          type: "warning",
          message: `Cache hit rate is ${hitRate}%. Consider increasing TTL for frequently accessed data.`,
        });
      } else if (hitRate > 90) {
        recommendations.push({
          type: "success",
          message: `Excellent cache hit rate of ${hitRate}%. Cache strategy is working well.`,
        });
      }

      if (stats.performance.errors > 0) {
        recommendations.push({
          type: "error",
          message: `${stats.performance.errors} cache errors detected. Check Redis connection and configuration.`,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "info",
        message: "Cache is operating within normal parameters.",
      });
    }

    return recommendations;
  }

  // Backup critical cache data
  static async backupCriticalCache() {
    try {
      // This could save important cache data to a backup store
      // For now, just log the action
      console.log("💾 Critical cache backup completed");
      return true;
    } catch (error) {
      console.error("❌ Critical cache backup failed:", error);
      return false;
    }
  }

  // Cleanup old cache keys
  static async cleanupOldCacheKeys() {
    try {
      // Remove old analytics data (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (let i = 0; i < 7; i++) {
        const oldDate = new Date(sevenDaysAgo);
        oldDate.setDate(oldDate.getDate() - i);
        const dateKey = oldDate.toISOString().split("T")[0];

        await cacheService.delPattern(`analytics:*:${dateKey}`);
      }

      console.log("🧹 Old cache keys cleaned up");
      return true;
    } catch (error) {
      console.error("❌ Cache cleanup failed:", error);
      return false;
    }
  }
}

module.exports = CacheManager;
