/**
 * Optional Redis Client
 * Redis is completely optional - app works without it
 */

const logger = require('../utils/logger');

class OptionalRedisClient {
  constructor() {
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
    this.isConnected = false;
    this.client = null;
    
    if (!this.isEnabled) {
      console.log('ℹ️ Redis disabled - using in-memory fallback');
      logger.info('Redis disabled - using in-memory fallback');
      return;
    }

    // Only try to connect if explicitly enabled
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      const Redis = require('ioredis');
      
      this.client = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 3000,
        commandTimeout: 2000,
        
        retryStrategy: (times) => {
          if (times > 1) return null; // Only 1 retry
          return 500; // 500ms delay
        }
      });

      // Silent error handling
      this.client.on('error', (err) => {
        this.isConnected = false;
        if (err.code === 'ECONNREFUSED') {
          console.log('ℹ️ Redis server not running - using fallback');
          logger.info('Redis server not running - using fallback');
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected successfully');
        logger.info('Redis connected successfully');
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

    } catch (error) {
      console.log('ℹ️ Redis initialization failed - using fallback');
      logger.info('Redis initialization failed - using fallback');
      this.client = null;
    }
  }

  // All methods return gracefully if Redis not available
  async get(key) {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return null;
    }
    
    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        return await this.client.setex(key, ttl, serializedValue);
      } else {
        return await this.client.set(key, serializedValue);
      }
    } catch (error) {
      return false;
    }
  }

  async del(key) {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return false;
    }
    
    try {
      return await this.client.del(key);
    } catch (error) {
      return false;
    }
  }

  async exists(key) {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return false;
    }
    
    try {
      return await this.client.exists(key);
    } catch (error) {
      return false;
    }
  }

  async ping() {
    if (!this.isEnabled || !this.client) {
      return false;
    }
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  // Health check
  getStatus() {
    return {
      enabled: this.isEnabled,
      connected: this.isConnected,
      available: this.client !== null
    };
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.log('ℹ️ Redis disconnect completed');
      }
    }
  }
}

// Create singleton instance
const redisClient = new OptionalRedisClient();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisClient.disconnect();
});

process.on('SIGINT', async () => {
  await redisClient.disconnect();
});

module.exports = redisClient;
