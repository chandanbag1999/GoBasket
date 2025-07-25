// Load environment variables first
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');

// Handle uncaught exceptions (should be at the top)
process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught Exception! Shutting down...', err);
  console.error('❌ Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

// start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Test Redis connection
    console.log('🔄 Testing Redis connection...');
    const redisHealthy = await redisClient.ping();
    if (redisHealthy) {
      console.log('✅ Redis connection successful');
      logger.info('Redis connection verified');
    } else {
      console.warn('⚠️  Redis connection failed, but server will continue');
      logger.warn('Redis connection failed during startup');
    }

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      const message = `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`;
      console.log(message);
      logger.info(message);
      
      // Log important information
      logger.info('Server startup completed', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('❌ Unhandled Promise Rejection! Shutting down...', err);
      console.error('❌ Unhandled Rejection:', err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      logger.info('👋 SIGTERM received. Shutting down gracefully...');
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      
      server.close(async () => {
        try {
          await redisClient.disconnect();
          logger.info('✅ Server closed gracefully');
          console.log('✅ Server closed gracefully');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    });

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', async () => {
      logger.info('👋 SIGINT received. Shutting down gracefully...');
      console.log('👋 SIGINT received. Shutting down gracefully...');
      
      server.close(async () => {
        try {
          await redisClient.disconnect();
          logger.info('✅ Server closed gracefully');
          console.log('✅ Server closed gracefully');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
