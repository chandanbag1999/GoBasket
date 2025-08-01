const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.isConnected = false;
    this.client = null;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';

    if (!this.isEnabled) {
      logger.info('Redis disabled in environment configuration');
      return;
    }

    try {

      // Redis Cloud connection configuration
      this.client = new Redis(process.env.REDIS_URL, {
        // Connection options optimized for Redis Cloud
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: false,          // Connect immediately for cloud
        keepAlive: 30000,            // Keep connection alive
        connectTimeout: 15000,       // 15 seconds for cloud connection
        commandTimeout: 5000,        // 5 seconds command timeout
        family: 4,                   // Force IPv4

        // Retry strategy for cloud
        retryStrategy: (times) => {
          if (times > 5) return null; // More retries for cloud
          const delay = Math.min(times * 200, 3000);
          console.log(`🔄 Redis reconnecting attempt ${times}, delay: ${delay}ms`);
          return delay;
        }
      });

      // Connection event handlers for Redis Cloud
      this.client.on('connect', () => {
        logger.info('Redis Cloud connection established');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis Cloud ready and operational');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis Cloud error:', err.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis Cloud connection closed');
      });

      this.client.on('reconnecting', (delay) => {
        logger.info(`Redis Cloud reconnecting in ${delay}ms`);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis Cloud connection ended');
      });
    } catch (error) {
      console.warn('⚠️ Redis initialization failed (continuing without Redis):', error.message);
      logger.warn('Redis initialization failed (continuing without Redis):', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  // GET method - data retrieve karne ke liye
  async get(key) {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return null;
    }
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
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  // DELETE method - data remove karne ke liye
  async del(key) {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  // EXISTS method - check if key exists
  async exists(key) {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // EXPIRE method - set expiry for existing key
  async expire(key, seconds) {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // Health check method
  async ping() {
    if (!this.client) {
      return false;
    }
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
