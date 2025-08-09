const redis = require("redis");

const client = redis.createClient({
  url:
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || 6379
    }`,
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0, // ✅ FIXED: Use DB 0 for Redis Cloud compatibility
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

client.on("error", (err) => {
  console.error("❌ Redis Cache Error:", err);
});

client.on("connect", () => {
  console.log("✅ Redis Cache connected successfully");
});

client.on("reconnecting", () => {
  console.log("🔄 Redis Cache reconnecting...");
});

client.on("ready", () => {
  console.log("⚡ Redis Cache ready for operations");
});

// Connect the client
(async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error("❌ Redis Cache connection failed:", error);
  }
})();

class CacheService {
  constructor() {
    this.defaultTTL = {
      SHORT: 60, // 1 minute
      MEDIUM: 300, // 5 minutes
      LONG: 1800, // 30 minutes
      VERY_LONG: 3600, // 1 hour
      DAILY: 86400, // 24 hours
    };

    this.keyPrefixes = {
      PRODUCTS: "products",
      CATEGORIES: "categories",
      USERS: "users",
      ORDERS: "orders",
      CART: "cart",
      SEARCH: "search",
      ANALYTICS: "analytics",
      INVENTORY: "inventory",
      PROMOTIONS: "promotions",
      NOTIFICATIONS: "notifications",
      SESSIONS: "sessions",
      REVIEWS: "reviews",
    };

    // Performance monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: 0,
    };
  }

  // Generic cache methods with error handling
  async get(key) {
    try {
      this.stats.operations++;
      const value = await client.get(key);

      if (value) {
        this.stats.hits++;
        console.log(`✅ Cache HIT: ${key}`);
        return JSON.parse(value);
      }

      this.stats.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL.MEDIUM) {
    try {
      this.stats.operations++;
      // ✅ FIXED: Use Redis v5 compatible syntax
      await client.set(key, JSON.stringify(value), { EX: ttl });
      console.log(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache set error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      this.stats.operations++;
      await client.del(key);
      console.log(`✅ Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache delete error:", error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      this.stats.operations++;
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
        console.log(
          `✅ Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`
        );
      }
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache delete pattern error:", error);
      return false;
    }
  }

  // Enhanced cache with fallback function
  async getOrSet(key, fallbackFn, ttl = this.defaultTTL.MEDIUM) {
    try {
      // Try to get from cache first
      let cachedValue = await this.get(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      // Cache miss - execute fallback function
      console.log(`🔄 Cache MISS - Executing fallback for: ${key}`);
      const freshValue = await fallbackFn();

      // Store in cache for next time (don't wait)
      this.set(key, freshValue, ttl).catch((err) =>
        console.error("Background cache set failed:", err)
      );

      return freshValue;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache getOrSet error:", error);
      // If cache fails, still return the fresh value
      return await fallbackFn();
    }
  }

  // Product caching methods
  generateProductKey(identifier, params = {}) {
    const paramString =
      Object.keys(params).length > 0
        ? ":" +
          Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .sort()
            .join("&")
        : "";
    return `${this.keyPrefixes.PRODUCTS}:${identifier}${paramString}`;
  }

  async cacheProduct(productId, product, ttl = this.defaultTTL.LONG) {
    const key = this.generateProductKey(productId);
    return this.set(key, product, ttl);
  }

  async getCachedProduct(productId) {
    const key = this.generateProductKey(productId);
    return this.get(key);
  }

  async cacheProductList(
    listType,
    products,
    params = {},
    ttl = this.defaultTTL.MEDIUM
  ) {
    const key = this.generateProductKey(listType, params);
    return this.set(key, products, ttl);
  }

  async getCachedProductList(listType, params = {}) {
    const key = this.generateProductKey(listType, params);
    return this.get(key);
  }

  async invalidateProductCache(productId) {
    const patterns = [
      `${this.keyPrefixes.PRODUCTS}:${productId}*`,
      `${this.keyPrefixes.PRODUCTS}:list*`,
      `${this.keyPrefixes.PRODUCTS}:featured*`,
      `${this.keyPrefixes.PRODUCTS}:category*`,
      `${this.keyPrefixes.SEARCH}:*`,
      `${this.keyPrefixes.REVIEWS}:product:${productId}*`,
    ];

    const promises = patterns.map((pattern) => this.delPattern(pattern));
    await Promise.all(promises);
  }

  // Category caching methods
  async cacheCategories(categories, ttl = this.defaultTTL.VERY_LONG) {
    const key = `${this.keyPrefixes.CATEGORIES}:all`;
    return this.set(key, categories, ttl);
  }

  async getCachedCategories() {
    const key = `${this.keyPrefixes.CATEGORIES}:all`;
    return this.get(key);
  }

  async cacheCategoryTree(tree, ttl = this.defaultTTL.VERY_LONG) {
    const key = `${this.keyPrefixes.CATEGORIES}:tree`;
    return this.set(key, tree, ttl);
  }

  async getCachedCategoryTree() {
    const key = `${this.keyPrefixes.CATEGORIES}:tree`;
    return this.get(key);
  }

  async invalidateCategoryCache() {
    await Promise.all([
      this.delPattern(`${this.keyPrefixes.CATEGORIES}:*`),
      this.delPattern(`${this.keyPrefixes.PRODUCTS}:category*`),
    ]);
  }

  // Search caching methods
  generateSearchKey(query, filters = {}) {
    const filterString =
      Object.keys(filters).length > 0
        ? ":" +
          Object.entries(filters)
            .map(([k, v]) => `${k}=${v}`)
            .sort()
            .join("&")
        : "";
    const encodedQuery = encodeURIComponent(query.toLowerCase().trim());
    return `${this.keyPrefixes.SEARCH}:${encodedQuery}${filterString}`;
  }

  async cacheSearchResults(
    query,
    filters,
    results,
    ttl = this.defaultTTL.MEDIUM
  ) {
    const key = this.generateSearchKey(query, filters);
    return this.set(key, results, ttl);
  }

  async getCachedSearchResults(query, filters = {}) {
    const key = this.generateSearchKey(query, filters);
    return this.get(key);
  }

  async invalidateSearchCache() {
    await this.delPattern(`${this.keyPrefixes.SEARCH}:*`);
  }

  // User-specific caching methods
  async cacheUserData(userId, dataType, data, ttl = this.defaultTTL.MEDIUM) {
    const key = `${this.keyPrefixes.USERS}:${userId}:${dataType}`;
    return this.set(key, data, ttl);
  }

  async getCachedUserData(userId, dataType) {
    const key = `${this.keyPrefixes.USERS}:${userId}:${dataType}`;
    return this.get(key);
  }

  async invalidateUserCache(userId) {
    await this.delPattern(`${this.keyPrefixes.USERS}:${userId}:*`);
  }

  // Cart caching methods
  async cacheCart(userId, cart, ttl = this.defaultTTL.SHORT) {
    const key = `${this.keyPrefixes.CART}:${userId}`;
    return this.set(key, cart, ttl);
  }

  async getCachedCart(userId) {
    const key = `${this.keyPrefixes.CART}:${userId}`;
    return this.get(key);
  }

  async invalidateCart(userId) {
    const key = `${this.keyPrefixes.CART}:${userId}`;
    await this.del(key);
  }

  // Analytics caching methods
  async cacheAnalytics(type, data, ttl = this.defaultTTL.LONG) {
    const key = `${this.keyPrefixes.ANALYTICS}:${type}:${
      new Date().toISOString().split("T")[0]
    }`;
    return this.set(key, data, ttl);
  }

  async getCachedAnalytics(type) {
    const key = `${this.keyPrefixes.ANALYTICS}:${type}:${
      new Date().toISOString().split("T")[0]
    }`;
    return this.get(key);
  }

  // Inventory caching methods
  async cacheInventoryData(type, data, ttl = this.defaultTTL.MEDIUM) {
    const key = `${this.keyPrefixes.INVENTORY}:${type}`;
    return this.set(key, data, ttl);
  }

  async getCachedInventoryData(type) {
    const key = `${this.keyPrefixes.INVENTORY}:${type}`;
    return this.get(key);
  }

  async invalidateInventoryCache() {
    await this.delPattern(`${this.keyPrefixes.INVENTORY}:*`);
  }

  // Promotion caching methods
  async cachePromotions(userId, promotions, ttl = this.defaultTTL.MEDIUM) {
    const key = `${this.keyPrefixes.PROMOTIONS}:user:${userId}`;
    return this.set(key, promotions, ttl);
  }

  async getCachedPromotions(userId) {
    const key = `${this.keyPrefixes.PROMOTIONS}:user:${userId}`;
    return this.get(key);
  }

  async cachePromotionCode(code, promotion, ttl = this.defaultTTL.LONG) {
    const key = `${this.keyPrefixes.PROMOTIONS}:code:${code.toUpperCase()}`;
    return this.set(key, promotion, ttl);
  }

  async getCachedPromotionCode(code) {
    const key = `${this.keyPrefixes.PROMOTIONS}:code:${code.toUpperCase()}`;
    return this.get(key);
  }

  async invalidatePromotionCache() {
    await this.delPattern(`${this.keyPrefixes.PROMOTIONS}:*`);
  }

  // ✅ FIXED: Batch operations for efficiency with Redis v5 compatibility
  async setBatch(items) {
    try {
      const pipeline = client.multi();

      items.forEach(({ key, value, ttl = this.defaultTTL.MEDIUM }) => {
        // ✅ FIXED: Use Redis v5 compatible syntax for batch operations
        pipeline.set(key, JSON.stringify(value), { EX: ttl });
      });

      await pipeline.exec();
      console.log(`✅ Cache BATCH SET: ${items.length} items`);
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache batch set error:", error);
      return false;
    }
  }

  async getBatch(keys) {
    try {
      const pipeline = client.multi();
      keys.forEach((key) => pipeline.get(key));

      const results = await pipeline.exec();

      const parsedResults = results.map((result, index) => {
        if (result[0] === null && result[1]) {
          this.stats.hits++;
          console.log(`✅ Cache BATCH HIT: ${keys[index]}`);
          return JSON.parse(result[1]);
        }

        this.stats.misses++;
        console.log(`❌ Cache BATCH MISS: ${keys[index]}`);
        return null;
      });

      return parsedResults;
    } catch (error) {
      this.stats.errors++;
      console.error("❌ Cache batch get error:", error);
      return keys.map(() => null);
    }
  }

  // Cache statistics and monitoring
  async getCacheStats() {
    try {
      const [info, keyspace, memory] = await Promise.all([
        client.info(),
        client.info("keyspace"),
        client.info("memory"),
      ]);

      // Calculate hit rate
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate =
        totalRequests > 0
          ? ((this.stats.hits / totalRequests) * 100).toFixed(2)
          : 0;

      return {
        performance: {
          hitRate: `${hitRate}%`,
          hits: this.stats.hits,
          misses: this.stats.misses,
          errors: this.stats.errors,
          totalOperations: this.stats.operations,
        },
        redis: {
          info: info,
          keyspace: keyspace,
          memory: memory,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("❌ Cache stats error:", error);
      return {
        performance: this.stats,
        redis: null,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: 0,
    };
  }

  // Cache warming methods
  async warmupCache() {
    console.log("🔥 Starting cache warmup...");

    try {
      const warmupTasks = [];

      // Warm up categories
      warmupTasks.push(this.warmupCategories());

      // Warm up featured products
      warmupTasks.push(this.warmupFeaturedProducts());

      // Warm up popular search terms
      warmupTasks.push(this.warmupPopularSearches());

      await Promise.all(warmupTasks);

      console.log("✅ Cache warmup completed");
    } catch (error) {
      console.error("❌ Cache warmup error:", error);
    }
  }

  async warmupCategories() {
    try {
      const Category = require("../models/Category");

      // Warm up all categories
      const categories = await Category.findActiveCategories();
      await this.cacheCategories(categories);

      // Warm up category tree
      const categoryTree = await Category.find({ isActive: true }).sort({
        level: 1,
        sortOrder: 1,
      });
      await this.cacheCategoryTree(categoryTree);

      console.log("✅ Categories cache warmed up");
    } catch (error) {
      console.error("❌ Categories warmup failed:", error);
    }
  }

  async warmupFeaturedProducts() {
    try {
      const Product = require("../models/Product");

      const featuredProducts = await Product.findActiveProducts({
        featured: true,
        limit: 20,
      });

      await this.cacheProductList(
        "featured",
        featuredProducts,
        {},
        this.defaultTTL.LONG
      );

      console.log("✅ Featured products cache warmed up");
    } catch (error) {
      console.error("❌ Featured products warmup failed:", error);
    }
  }

  async warmupPopularSearches() {
    try {
      // Warm up common search terms
      const popularTerms = ["apple", "banana", "milk", "bread", "rice"];

      for (const term of popularTerms) {
        const key = this.generateSearchKey(term, {});
        // Pre-cache empty results to avoid database hits for popular terms
        await this.set(
          key,
          { products: [], totalProducts: 0 },
          this.defaultTTL.SHORT
        );
      }

      console.log("✅ Popular searches cache warmed up");
    } catch (error) {
      console.error("❌ Popular searches warmup failed:", error);
    }
  }

  // Health check for cache service
  async healthCheck() {
    try {
      const testKey = "health_check_test";
      const testValue = { timestamp: Date.now() };

      // Test write
      await this.set(testKey, testValue, 60);

      // Test read
      const retrieved = await this.get(testKey);

      // Test delete
      await this.del(testKey);

      const isHealthy =
        retrieved && retrieved.timestamp === testValue.timestamp;

      return {
        healthy: isHealthy,
        latency: Date.now() - testValue.timestamp,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  // ✅ ENHANCED: Connection management methods
  async isConnected() {
    try {
      return client.isReady;
    } catch (error) {
      return false;
    }
  }

  async reconnect() {
    try {
      if (!client.isReady) {
        await client.connect();
      }
      return true;
    } catch (error) {
      console.error("❌ Cache reconnection failed:", error);
      return false;
    }
  }

  async disconnect() {
    try {
      await client.disconnect();
      console.log("✅ Cache service disconnected");
      return true;
    } catch (error) {
      console.error("❌ Cache disconnect error:", error);
      return false;
    }
  }
}

module.exports = new CacheService();
