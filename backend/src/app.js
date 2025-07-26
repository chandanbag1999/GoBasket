const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

// Import security middleware
const { rateLimits, securityHeaders, blockSuspiciousIPs } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const testRoutes = require('./routes/test');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');

// Create Express application
const app = express();

// Trust proxy (important for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Block suspicious IPs first
app.use(blockSuspiciousIPs);

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}));

// Compression middleware (reduces response size)
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses if this request has a 'x-no-compression' header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Default compression filter
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Body parsing middleware with size limits
app.use(express.json({
  limit: '10mb',
  type: 'application/json',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));

// Only parse urlencoded data, not multipart/form-data (let multer handle that)
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 50,
  type: 'application/x-www-form-urlencoded'
}));

// Input sanitization (remove HTML tags)
app.use(sanitizeInput);

// HTTP request logging
app.use(morgan('combined', {
  stream: { 
    write: message => logger.info(message.trim()) 
  },
  skip: (req, res) => {
    // Skip logging for health check and static files
    return req.originalUrl === '/health' || req.originalUrl.startsWith('/static');
  }
}));

// Apply general rate limiting to all API routes
app.use('/api', rateLimits.api);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running perfectly! 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    security: 'Enhanced security enabled'
  });
});


// Mount routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);


// API status endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Quick Commerce API v1.0 with Product Management! 🍕',
    version: '1.0.0',
    features: {
      authentication: 'JWT-based with Redis caching',
      userManagement: 'Multi-role system with profile management',
      productManagement: 'Categories, products, variants, customizations',
      fileUpload: 'Cloudinary integration for images',
      search: 'Full-text search with filters'
    },
    endpoints: {
      auth: '/api/v1/auth/*',
      categories: '/api/v1/categories/*',
      products: '/api/v1/products/*',
      admin: '/api/v1/admin/*',
      test: '/api/v1/test/*'
    }
  });
});

// Handle 404 routes
app.all('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: ['/health', '/api/v1'],
    method: req.method
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
