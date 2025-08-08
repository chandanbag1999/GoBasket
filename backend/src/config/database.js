const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if already connected
      if (this.isConnected) {
        console.log('✅ Already connected to MongoDB');
        return this.connection;
      }

      // Updated connection options for Mongoose 6+ compatibility
      const options = {
        // Basic connection options
        maxPoolSize: 10, // Maximum number of connections in the pool
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        
        // Mongoose 6+ removed these deprecated options:
        // ❌ useNewUrlParser: true (default in 6+)
        // ❌ useUnifiedTopology: true (default in 6+)
        // ❌ bufferMaxEntries: 0 (deprecated)
        // ❌ bufferCommands: false (use different approach)
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);
      this.isConnected = true;

      console.log('✅ ================================');
      console.log(`🍃 MongoDB Connected Successfully!`);
      console.log(`📍 Host: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);
      console.log('✅ ================================');

      // Setup event listeners
      this.setupEventListeners();

      return this.connection;

    } catch (error) {
      console.error('❌ MongoDB connection failed:');
      console.error(`📋 Error: ${error.message}`);
      
      if (error.message.includes('authentication')) {
        console.error('🔐 Check your username and password in MONGODB_URI');
      } else if (error.message.includes('network')) {
        console.error('🌐 Check your internet connection and IP whitelist');
      }
      
      process.exit(1);
    }
  }

  setupEventListeners() {
    // Connection successful
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    // Connection error
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      this.isConnected = false;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // App termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔄 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }

  // Close connection manually (for testing)
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔄 MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseConnection();
