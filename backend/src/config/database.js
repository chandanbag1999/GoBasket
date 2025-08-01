const mongoose = require('mongoose');
const logger = require('../utils/logger'); 


const connectDB = async () => {
  try {
    // Skip MongoDB connection if not available in development
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('127.0.0.1')) {
      logger.warn('MongoDB not available, using in-memory fallback for development');
      return;
    }

    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Try to connect with the provided URI
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners (important for production)
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    logger.warn('Continuing without database connection');

    // Don't exit process, let app run without database
    // process.exit(1);
  }
};

module.exports = connectDB;
