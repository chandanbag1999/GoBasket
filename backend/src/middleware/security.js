const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');

// Rate limiting factory function
const createRateLimit = (windowMs, max, message, skipSuccessful = false) => {
  return rateLimit({
    windowMs,               // Time window in milliseconds
    max,                   // Maximum requests per window
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000) // Seconds to wait
    },
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
    skipSuccessful,        // Don't count successful requests
    
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    },
    
    // Skip function for certain conditions
    skip: (req) => {
      // Skip rate limiting for health check
      return req.originalUrl === '/health';
    }
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // Authentication endpoints - stricter limits
  auth: createRateLimit(
    15 * 60 * 1000,    // 15 minutes
    5,                 // 5 attempts
    'Too many authentication attempts. Please try again after 15 minutes.',
    false
  ),
  
  // Password reset - very strict
  passwordReset: createRateLimit(
    60 * 60 * 1000,    // 1 hour
    3,                 // 3 attempts
    'Too many password reset attempts. Please try again after 1 hour.',
    false
  ),
  
  // General API endpoints
  api: createRateLimit(
    15 * 60 * 1000,    // 15 minutes
    100,               // 100 requests
    'Too many requests from this IP. Please try again after 15 minutes.',
    true               // Don't count successful requests
  ),
  
  // File upload - moderate limits
  upload: createRateLimit(
    60 * 1000,         // 1 minute
    10,                // 10 uploads
    'Too many file uploads. Please try again after 1 minute.',
    false
  ),
  
  // Search endpoints - higher limits
  search: createRateLimit(
    60 * 1000,         // 1 minute
    30,                // 30 searches
    'Too many search requests. Please try again after 1 minute.',
    true
  )
};

// Enhanced security headers configuration
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' }
});

// IP-based blocking (for production)
const blockSuspiciousIPs = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // List of blocked IPs (in production, store in database/Redis)
  const blockedIPs = [
    // Add malicious IPs here
  ];
  
  if (blockedIPs.includes(clientIP)) {
    logger.warn(`Blocked suspicious IP attempt: ${clientIP}`, {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
};

module.exports = {
  rateLimits,
  securityHeaders,
  blockSuspiciousIPs
};
