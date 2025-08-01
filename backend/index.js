// Load environment variables first
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');
const socketService = require('./src/services/socketService');
const QueueWorkers = require('./src/workers/queueWorkers');
// const { cacheWarming } = require('./src/middleware/cache');

// Handle uncaught exceptions (should be at the top)
process.on('uncaughtException', (err) => {
  logger.error('❌ Uncaught Exception! Shutting down...', err);
  console.error('❌ Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

// Initialize queue workers
const queueWorkers = new QueueWorkers();


// start server
const startServer = async () => {
  try {
    // Initialize services
    console.log('🚀 Starting GoBasket API Server...');

    // Connect to database
    await connectDB();

    // Initialize Redis & Queue Workers (if enabled)
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const redisHealthy = await redisClient.ping();
        if (redisHealthy) {
          queueWorkers.startAllWorkers();
          logger.info('Redis Cloud & queue workers initialized');
        }
      } catch (error) {
        logger.warn('Redis Cloud connection failed, continuing without cache');
      }
    }



    // Warm up caches (optional) - Disabled for now
    // console.log('🔄 Warming up caches...');
    // try {
    //   await cacheWarming.warmAllCaches();
    //   console.log('✅ Cache warming completed');
    // } catch (error) {
    //   console.warn('⚠️  Cache warming failed, continuing without cache');
    //   logger.warn('Cache warming failed, continuing without cache');
    // }

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`✅ GoBasket API ready on port ${PORT}`);
      logger.info(`Server started on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Initialize Socket.io
    socketService.initialize(server);

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`👋 ${signal} received. Shutting down gracefully...`);
      console.log(`👋 ${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        try {
          // Stop queue workers
          await queueWorkers.stopAllWorkers();
          
          // Disconnect Redis
          await redisClient.disconnect();
          
          // Close queue connections
          const { gracefulShutdown: shutdownQueues } = require('./src/config/queue');
          await shutdownQueues();
          
          logger.info('✅ Server closed gracefully');
          console.log('✅ Server closed gracefully');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('❌ Unhandled Promise Rejection! Shutting down...', err);
      console.error('❌ Unhandled Rejection:', err.name, err.message);
      
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
