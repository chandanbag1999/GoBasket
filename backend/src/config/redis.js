const redis = require('redis');

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      console.log(`🔗 Attempting Redis connection with URL format: ${redisUrl.startsWith('rediss://') ? 'SSL/TLS' : 'non-SSL'}`);

      // Simplified configuration based on search results
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 30000, // Increase timeout
          reconnectStrategy: (retries) => {
            if (retries >= this.maxReconnectAttempts) {
              console.error('❌ Max Redis reconnection attempts reached');
              return false;
            }
            const delay = Math.min(retries * 1000, 5000); // Max 5 second delay
            console.log(`🔄 Redis reconnecting in ${delay}ms... (attempt ${retries + 1})`);
            return delay;
          }
        }
      });

      // Setup event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();

      console.log('✅ ================================');
      console.log('🔴 Redis Connected Successfully!');
      console.log(`📍 URL: ${redisUrl.replace(/:[^:@]*@/, ':****@')}`);
      console.log('✅ ================================');

      return this.client;

    } catch (error) {
      console.error('❌ Redis connection failed:');
      console.error(`📋 Error: ${error.message}`);
      
      if (error.message.includes('ssl3_get_record:wrong version number')) {
        console.error('🔐 SSL/TLS Issue - Try updating REDIS_URL to use rediss:// or check Redis Cloud settings');
      }
      
      throw error;
    }
  }

  setupEventListeners() {
    this.client.on('connect', () => {
      console.log('🔗 Redis client connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      console.log('⚡ Redis client ready for commands');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.warn('⚠️  Redis connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Redis reconnecting... (attempt ${this.reconnectAttempts})`);
    });
  }

  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      isReady: this.client?.isReady || false
    };
  }

  async ping() {
    try {
      const client = this.getClient();
      const result = await client.ping();
      console.log('🏓 Redis ping successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Redis ping failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        console.log('🔄 Redis disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error);
      throw error;
    }
  }
}

module.exports = new RedisConnection();
