const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

// Import security middleware
const { rateLimitStrategies } = require('./middleware/advancedRateLimit');
const { securityHeaders, blockSuspiciousIPs } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

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
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
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

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


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
app.use('/api', rateLimitStrategies.api);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running perfectly! 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    features: {
      authentication: 'Enabled',
      rateLimiting: 'Enabled',
      caching: 'Enabled',
      queues: 'Enabled',
      analytics: 'Enabled',
      realTime: 'Enabled'
    }
  });
});


// Mount routes
app.use('/api/v1/auth', rateLimitStrategies.authentication, authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', rateLimitStrategies.search, productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', rateLimitStrategies.orderPlacement, orderRoutes);
app.use('/api/v1/payments', rateLimitStrategies.payment, paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);


// API status endpoint
// API status endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Quick Commerce API v1.0 - Production Ready! 🎯',
    version: '1.0.0',
    features: {
      authentication: 'JWT-based with Redis caching & rate limiting',
      userManagement: 'Multi-role system with comprehensive profiles',
      productManagement: 'Categories, products, variants, customizations',
      orderManagement: 'Complete lifecycle with real-time tracking',
      paymentGateway: 'Razorpay integration (UPI, Cards, NetBanking, Wallets)',
      queueSystem: 'Background job processing with Bull & Redis',
      notifications: 'Email & SMS via queues',
      analytics: 'Advanced business intelligence dashboard',
      caching: 'Redis-based multi-layer caching strategy',
      rateLimiting: 'Advanced rate limiting with Redis store',
      fileUpload: 'Cloudinary integration with optimization',
      realTime: 'Socket.io for live order tracking',
      security: 'Comprehensive security headers & input validation'
    },
    endpoints: {
      auth: '/api/v1/auth/* (Login, Register, Profile)',
      categories: '/api/v1/categories/* (Category management)',
      products: '/api/v1/products/* (Product catalog)',
      cart: '/api/v1/cart/* (Shopping cart)',
      orders: '/api/v1/orders/* (Order management)',
      payments: '/api/v1/payments/* (Payment processing)',
      analytics: '/api/v1/analytics/* (Business analytics)',
      admin: '/api/v1/admin/* (Admin operations)'
    },
    architecture: {
      database: 'MongoDB with optimized indexes',
      cache: 'Redis for caching & sessions',
      queue: 'Bull queues for background processing',
      storage: 'Cloudinary for file management',
      realTime: 'Socket.io for live updates'
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
    availableRoutes: [
      '/health',
      '/api/v1',
      '/api/v1/auth/*',
      '/api/v1/categories/*',
      '/api/v1/products/*',
      '/api/v1/cart/*',
      '/api/v1/orders/*',
      '/api/v1/payments/*',
      '/api/v1/analytics/*',
      '/api/v1/admin/*'
    ],
    method: req.method
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
