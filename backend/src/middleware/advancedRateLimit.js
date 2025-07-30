const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('ioredis');
const logger = require('../utils/logger');

// Create Redis client for rate limiting
const redisClient = new redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

// Advanced rate limiting with different strategies
const createAdvancedRateLimit = (options) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (command, ...args) => redisClient.send_command(command, ...args),
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
      limit: options.max,
      current: 0 // Will be set by the middleware
    },
    standardHeaders: true,
    legacyHeaders: false,

    // Validation configuration to disable warnings
    validate: {
      onLimitReached: false, // Disable deprecated onLimitReached warning
      keyGeneratorIpFallback: false, // Disable IPv6 key generator warning (we handle it properly)
      default: true
    },
    
    // Advanced configuration
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.originalUrl === '/health') return true;
      
      // Skip for admin users (optional)
      if (req.user && ['admin', 'sub-admin'].includes(req.user.role)) {
        return options.skipAdmin !== false;
      }
      
      return false;
    },
    
    // Custom key generator for different rate limiting strategies with IPv6 support
    keyGenerator: (req) => {
      let baseKey;
      if (options.keyGenerator) {
        baseKey = options.keyGenerator(req);
      } else {
        // Use ipKeyGenerator helper for proper IPv6 handling
        baseKey = ipKeyGenerator(req.ip);
      }
      return `rate_limit:${options.name}:${baseKey}`;
    },
    
    // Enhanced handler with logging (replaces deprecated onLimitReached)
    handler: (req, res, options) => {
      // Check if this is the first time the limit is reached (replaces onLimitReached)
      if (req.rateLimit.current === req.rateLimit.limit + 1) {
        logger.error('Rate limit threshold reached', {
          ip: req.ip,
          endpoint: req.originalUrl,
          limit: req.rateLimit.limit,
          window: options.windowMs,
          userId: req.user?._id,
          limitType: options.name || 'unknown'
        });
      }

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        userId: req.user?._id,
        limitType: options.name || 'unknown',
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining
      });

      const response = {
        success: false,
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
        limit: req.rateLimit.limit,
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(req.rateLimit.resetTime),
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl
      };

      res.status(429).json(response);
    }
  });
};

// Different rate limiting strategies
const rateLimitStrategies = {
  // Strict limits for authentication endpoints
  authentication: createAdvancedRateLimit({
    name: 'auth',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    skipAdmin: false // Don't skip admin for auth
  }),

  // Password reset - very strict
  passwordReset: createAdvancedRateLimit({
    name: 'password_reset',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset attempts. Please try again after 1 hour.',
    skipAdmin: false
  }),

  // Order placement - prevent spam orders
  orderPlacement: createAdvancedRateLimit({
    name: 'order_placement',
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders per 5 minutes
    message: 'Too many orders placed. Please wait before placing another order.',
    keyGenerator: (req) => req.user?._id || req.ip // Per user, not IP
  }),

  // Payment endpoints - financial security
  payment: createAdvancedRateLimit({
    name: 'payment',
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 payment attempts per 10 minutes
    message: 'Too many payment attempts. Please try again later.',
    keyGenerator: (req) => req.user?._id || req.ip
  }),

  // File upload limits
  fileUpload: createAdvancedRateLimit({
    name: 'file_upload',
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads. Please wait before uploading again.',
    keyGenerator: (req) => req.user?._id || req.ip
  }),

  // API endpoints - general protection
  api: createAdvancedRateLimit({
    name: 'api',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many API requests. Please try again later.',
    skipAdmin: true // Skip for admin users
  }),

  // Search endpoints - prevent abuse
  search: createAdvancedRateLimit({
    name: 'search',
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    message: 'Too many search requests. Please slow down.',
  }),

  // Admin endpoints - moderate limits
  admin: createAdvancedRateLimit({
    name: 'admin',
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for admin operations
    message: 'Too many admin requests. Please slow down.',
    skipAdmin: false
  })
};

// Flexible rate limiting by user role
const roleBasedRateLimit = (limits) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest';
    const limit = limits[userRole] || limits.default;
    
    if (!limit) {
      return next();
    }
    
    const rateLimiter = createAdvancedRateLimit({
      name: `role_${userRole}`,
      windowMs: limit.windowMs,
      max: limit.max,
      message: limit.message || `Too many requests for ${userRole} role.`,
      keyGenerator: (req) => `${req.user?._id || req.ip}:${userRole}`
    });
    
    return rateLimiter(req, res, next);
  };
};

// Dynamic rate limiting based on endpoint popularity
const dynamicRateLimit = (baseLimit, popularEndpoints) => {
  return (req, res, next) => {
    const endpoint = req.route?.path || req.originalUrl;
    const isPopular = popularEndpoints.includes(endpoint);
    
    const limit = isPopular ? Math.floor(baseLimit.max * 0.7) : baseLimit.max;
    
    const rateLimiter = createAdvancedRateLimit({
      name: 'dynamic',
      windowMs: baseLimit.windowMs,
      max: limit,
      message: `Rate limit exceeded for ${isPopular ? 'popular' : 'regular'} endpoint.`,
    });
    
    return rateLimiter(req, res, next);
  };
};

// Rate limit monitoring and statistics
const getRateLimitStats = async () => {
  try {
    const keys = await redisClient.keys('rate_limit:*');
    const stats = {};
    
    for (const key of keys) {
      const value = await redisClient.get(key);
      const [, , type] = key.split(':');
      
      if (!stats[type]) {
        stats[type] = { totalRequests: 0, uniqueClients: 0 };
      }
      
      stats[type].totalRequests += parseInt(value) || 0;
      stats[type].uniqueClients += 1;
    }
    
    return stats;
  } catch (error) {
    logger.error('Rate limit stats error:', error);
    return {};
  }
};

// Clear rate limits for a specific user/IP (admin function)
const clearRateLimit = async (identifier, type = null) => {
  try {
    const pattern = type 
      ? `rate_limit:${type}:${identifier}*`
      : `rate_limit:*:${identifier}*`;
      
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info('Rate limits cleared', { identifier, type, keysCleared: keys.length });
    }
    
    return { cleared: keys.length };
  } catch (error) {
    logger.error('Clear rate limit error:', error);
    throw error;
  }
};

module.exports = {
  rateLimitStrategies,
  roleBasedRateLimit,
  dynamicRateLimit,
  getRateLimitStats,
  clearRateLimit
};


