// Load environment variables first
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const redisClient = require('./src/config/redis');
const logger = require('./src/utils/logger');
const socketService = require('./src/services/socketService');
const QueueWorkers = require('./src/workers/queueWorkers');
const { cacheWarming } = require('./src/middleware/cache');

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

    // Start queue workers
    console.log('🔄 Starting background queue workers...');
    queueWorkers.startAllWorkers();
    console.log('✅ Queue workers started successfully');

    // Warm up caches
    console.log('🔄 Warming up caches...');
    await cacheWarming.warmAllCaches();
    console.log('✅ Cache warming completed');

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      const message = `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`;
      console.log(message);
      logger.info(message);

      // Log important information
      logger.info('Server startup completed with advanced features', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        features: [
          'Authentication & Authorization',
          'Product Management',
          'Order Management',
          'Payment Gateway (Razorpay)',
          'Queue Processing',
          'Real-time Updates (Socket.io)',
          'Advanced Analytics',
          'Caching Strategy',
          'Rate Limiting',
          'File Upload (Cloudinary)'
        ]
      });
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
