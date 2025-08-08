const tokenService = require('../services/tokenService');
const User = require('../models/User');

class AuthMiddleware {
  
  // Verify JWT Token and attach user to request
  static async authenticate(req, res, next) {
    try {
      // Extract token from Authorization header or cookies
      let token = null;
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      // Also check cookies (useful for web apps)
      if (!token && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access token is required for this resource',
          code: 'NO_TOKEN'
        });
      }

      // Verify access token
      let decoded;
      try {
        decoded = tokenService.verifyAccessToken(token);
      } catch (tokenError) {
        let message = 'Invalid access token';
        let code = 'INVALID_TOKEN';
        
        if (tokenError.message === 'Access token expired') {
          message = 'Access token has expired';
          code = 'TOKEN_EXPIRED';
        }
        
        return res.status(401).json({
          status: 'error',
          message,
          code
        });
      }

      // Get user from database
      const user = await User.findById(decoded.userId).select('+isActive');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found or token is invalid',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          status: 'error',
          message: 'Account is temporarily locked due to failed login attempts',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Verify session exists in Redis
      const session = await tokenService.getUserSession(user._id);
      if (!session) {
        return res.status(401).json({
          status: 'error',
          message: 'Session not found or has expired. Please login again.',
          code: 'SESSION_EXPIRED'
        });
      }

      // Attach user and session to request object
      req.user = user;
      req.session = session;
      req.tokenDecoded = decoded;
      
      next();
      
    } catch (error) {
      console.error('❌ Authentication middleware error:', error);
      
      return res.status(500).json({
        status: 'error',
        message: 'Authentication failed due to server error'
      });
    }
  }

  // Role-based access control
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required to access this resource'
        });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  }

  // Optional authentication (user can be null)
  static async optionalAuth(req, res, next) {
    try {
      let token = null;
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      if (!token && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }
      
      // If no token, continue without user
      if (!token) {
        req.user = null;
        req.session = null;
        return next();
      }

      // Try to verify token and get user
      try {
        const decoded = tokenService.verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('+isActive');
        
        if (user && user.isActive && !user.isLocked) {
          const session = await tokenService.getUserSession(user._id);
          if (session) {
            req.user = user;
            req.session = session;
            req.tokenDecoded = decoded;
          }
        }
      } catch (error) {
        // Token invalid or expired, but continue without user
        req.user = null;
        req.session = null;
      }

      next();
      
    } catch (error) {
      console.error('❌ Optional auth middleware error:', error);
      req.user = null;
      req.session = null;
      next();
    }
  }

  // Check if user owns resource or has admin privileges
  static resourceOwnership(resourceUserIdParam = 'userId') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required to access this resource'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership based on parameter or body
      const resourceUserId = req.params[resourceUserIdParam] || 
                            req.body[resourceUserIdParam] ||
                            req.query[resourceUserIdParam];
      
      if (!resourceUserId) {
        return res.status(400).json({
          status: 'error',
          message: 'Resource user ID not found in request'
        });
      }

      if (req.user._id.toString() !== resourceUserId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only access your own resources.',
          code: 'RESOURCE_OWNERSHIP_ERROR'
        });
      }

      next();
    };
  }

  // Verify email requirement
  static requireVerifiedEmail(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        status: 'error',
        message: 'Email verification required to access this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  }
}

module.exports = AuthMiddleware;
