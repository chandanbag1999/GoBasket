const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
    issuer: 'quick-commerce-api',
    audience: 'quick-commerce-app'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'quick-commerce-api',
    audience: 'quick-commerce-app'
  });
};

// Extract token from request
const extractToken = (req) => {
  let token = null;
  
  // Check Authorization header
  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      // Handle case where 'Bearer ' is missing
      token = req.headers.authorization;
    }
  }
  
  // Check cookies (for web applications)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check query parameter (for websockets)
  else if (req.query && req.query.token) {
    token = req.query.token;
  }
  
  return token;
};

// Main authentication middleware
const protect = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Check if token is blacklisted (for logout functionality)
      const isBlacklisted = await redisClient.get(`blacklist_${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token is valid but user no longer exists',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      // Update user activity in Redis
      await redisClient.set(
        `user_activity_${user._id}`, 
        {
          lastActivity: new Date(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }, 
        3600 // 1 hour expiry
      );
      
      // Add user to request object
      req.user = user;
      req.token = token;
      
      // Log successful authentication
      logger.info('User authenticated successfully', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      next();
      
    } catch (jwtError) {
      // Handle different JWT errors
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
        errorCode = 'MALFORMED_TOKEN';
      } else if (jwtError.name === 'NotBeforeError') {
        errorMessage = 'Token not active yet';
        errorCode = 'TOKEN_NOT_ACTIVE';
      }
      
      logger.warn('JWT verification failed', {
        error: jwtError.message,
        ip: req.ip,
        token: token.substring(0, 20) + '...' // Log only first 20 chars
      });
      
      return res.status(401).json({
        success: false,
        error: errorMessage,
        code: errorCode
      });
    }
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error in authentication',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Authorization middleware (role-based access control)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }
    
    // Log successful authorization
    logger.info('User authorized successfully', {
      userId: req.user._id,
      userRole: req.user.role,
      endpoint: req.originalUrl
    });
    
    next();
  };
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  
  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }
  
  next();
};

// Token blacklist function (for logout)
const blacklistToken = async (token, expiresIn = 86400) => {
  try {
    await redisClient.set(`blacklist_${token}`, 'true', expiresIn);
    logger.info('Token blacklisted successfully');
    return true;
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    return false;
  }
};

// Check if user has specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Define role permissions
    const rolePermissions = {
      'admin': ['all'],
      'sub-admin': ['read', 'write', 'manage-users'],
      'restaurant-owner': ['read', 'write', 'manage-menu'],
      'delivery-personnel': ['read', 'update-delivery'],
      'customer': ['read', 'place-order']
    };
    
    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission) && !userPermissions.includes('all')) {
      return res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  generateToken,
  verifyToken,
  blacklistToken,
  hasPermission
};
