const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    // Redis Cloud connection configuration
    this.client = new Redis(process.env.REDIS_URL, {
      // Connection options for Redis Cloud
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,           // Connect only when needed
      keepAlive: 30000,            // Keep connection alive
      connectTimeout: 10000,       // 10 seconds connect timeout
      commandTimeout: 5000,        // 5 seconds command timeout
      
      // Retry strategy
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.info(`Redis reconnecting, attempt ${times}, delay: ${delay}ms`);
        return delay;
      }
    });

    // Connection event handlers
    this.client.on('connect', () => {
      console.log('✅ Redis Cloud connected successfully');
      logger.info('Redis Cloud connected successfully');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready to receive commands');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      logger.error('Redis connection error:', err);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  // GET method - data retrieve karne ke liye
  async get(key) {
    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  // SET method - data store karne ke liye
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        return await this.client.setex(key, ttl, serializedValue);
      } else {
        return await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  // DELETE method - data remove karne ke liye
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  // EXISTS method - check if key exists
  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // EXPIRE method - set expiry for existing key
  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Health check method
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis PING error:', error);
      return false;
    }
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.client.disconnect();
      logger.info('Redis disconnected gracefully');
    } catch (error) {
      logger.error('Redis disconnect error:', error);
    }
  }
}

// Export single instance (Singleton pattern)
module.exports = new RedisClient();
