const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database connections
const database = require('./config/database');
const redisConnection = require('./config/redis');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route with database status
app.get('/health', async (req, res) => {
  try {
    const dbStatus = database.getConnectionStatus();
    const redisStatus = redisConnection.getConnectionStatus();

    res.status(200).json({
      status: 'success',
      message: 'Grocery App API is running successfully! 🚀',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      services: {
        mongodb: {
          connected: dbStatus.isConnected,
          host: dbStatus.host,
          database: dbStatus.name,
          readyState: dbStatus.readyState
        },
        redis: {
          connected: redisStatus.isConnected,
          ready: redisStatus.isReady,
          reconnectAttempts: redisStatus.reconnectAttempts
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Database connectivity test route
app.get('/test-db', async (req, res) => {
  try {
    const redisPing = await redisConnection.ping();
    
    res.json({
      status: 'success',
      message: 'Database connections tested successfully',
      mongodb: database.getConnectionStatus(),
      redis: {
        ...redisConnection.getConnectionStatus(),
        ping: redisPing
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error.message
    });
  }
});

// IMPORTANT: Add specific API routes FIRST, before any wildcard handlers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);


// ✅ FIXED: 404 handler for API routes that don't exist (Express 5 compatible)
app.use('/api/v1/*splat', (req, res) => {  // ✅ Added named parameter 'splat'
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: {
      auth: '/api/v1/auth/*',
      health: '/health',
      testDb: '/test-db'
    }
  });
});

// ✅ FIXED: Global 404 handler (Express 5 compatible)
app.use('/*splat', (req, res) => {  // ✅ Added named parameter 'splat'
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.status || 500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
});

// Initialize database connections before starting server
async function initializeConnections() {
  try {
    console.log('🔄 Initializing database connections...');
    
    // Connect to MongoDB
    await database.connect();
    
    // Connect to Redis
    await redisConnection.connect();
    
    console.log('✅ All database connections established successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to establish database connections:', error.message);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

// Start server with database connections
const startServer = async () => {
  try {
    // Initialize all connections first
    await initializeConnections();
    
    // Start the server
    app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Database test: http://localhost:${PORT}/test-db`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth/*`);
      console.log('🚀 ================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  await database.disconnect();
  await redisConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received. Shutting down gracefully...');
  await database.disconnect();
  await redisConnection.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
