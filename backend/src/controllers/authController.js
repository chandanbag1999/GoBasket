const User = require('../models/User');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');


// Register user(POST /api/v1/auth/register)
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    const { name, email, phone, password, role, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone }
      ]
    });

    if (existingUser) {
      const conflictField = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        error: `User already exists with this ${conflictField}`,
        conflictField
      });
    }

    // Prepare user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: role || 'customer'
    };

    // Add optional fields if provided
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (gender) userData.gender = gender;

    // Initialize role-specific profile
    if (userData.role === 'customer') {
      userData.customerProfile = {
        loyaltyPoints: 0,
        preferences: {}
      };
    } else if (userData.role === 'restaurant-owner') {
      userData.restaurantProfile = {
        isVerified: false,
        rating: { average: 0, count: 0 }
      };
    } else if (userData.role === 'delivery-personnel') {
      userData.deliveryProfile = {
        isAvailable: false,
        rating: { average: 0, count: 0 },
        earnings: { total: 0, thisMonth: 0 }
      };
    }

    // Create user
    const user = await User.create(userData);

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Generate email verification token
    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Cache user session in Redis
    await redisClient.set(`user_session_${user._id}`, {
      userId: user._id,
      role: user.role,
      email: user.email,
      lastActivity: new Date(),
      loginTime: new Date()
    }, 86400); // 24 hours expiry

    // Log successful registration
    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Response (don't send password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully! Please verify your email.',
      token,
      data: {
        user: userResponse
      },
      // In production, send this via email instead
      ...(process.env.NODE_ENV === 'development' && {
        emailVerificationToken
      })
    });

  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists`,
        field
      });
    }

    logger.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Server error during registration. Please try again.',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

// Login user(POST /api/v1/auth/login)
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, rememberMe = false } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password +loginAttempts');

    if (!user) {
      logger.warn('Login attempt with non-existent email', {
        email: email.toLowerCase(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      logger.warn('Login attempt on locked account', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });

      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
        lockedUntil: user.loginAttempts.lockedUntil
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      logger.warn('Failed login attempt', {
        userId: user._id,
        email: user.email,
        attempts: user.loginAttempts.count + 1,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        attemptsRemaining: Math.max(0, 5 - (user.loginAttempts.count + 1))
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts.count > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token with extended expiry if rememberMe
    const tokenExpiry = rememberMe ? '30d' : process.env.JWT_EXPIRE;
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: tokenExpiry,
        issuer: 'quick-commerce-api',
        audience: 'quick-commerce-app'
      }
    );

    // Cache user session
    const sessionExpiry = rememberMe ? 2592000 : 86400; // 30 days or 24 hours
    await redisClient.set(`user_session_${user._id}`, {
      userId: user._id,
      role: user.role,
      email: user.email,
      lastActivity: new Date(),
      loginTime: new Date(),
      rememberMe,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, sessionExpiry);

    // Log successful login
    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      rememberMe,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Prepare response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      lastLogin: user.lastLogin,
      addresses: user.addresses,
      fullProfile: user.fullProfile
    };

    // Set HTTP-only cookie for web clients
    const cookieOptions = {
      expires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      stack: error.stack,
      body: { email: req.body.email }, // Don't log password
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Server error during login. Please try again.'
    });
  }
};

// Logout user(POST /api/v1/auth/logout)
exports.logout = async (req, res) => {
  try {
    // Remove user session from Redis
    await redisClient.del(`user_session_${req.user._id}`);

    // Blacklist current token
    const { blacklistToken } = require('../middleware/auth');
    await blacklistToken(req.token);

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true
    });

    logger.info('User logged out successfully', {
      userId: req.user._id,
      email: req.user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// Get current logged in user profile(GET /api/v1/auth/me)

exports.getMe = async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          addresses: user.addresses,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          notifications: user.notifications,
          fullProfile: user.fullProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching profile'
    });
  }
};

// Update user profile(PUT /api/v1/auth/profile)
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, phone, dateOfBirth, gender } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          error: 'Phone number already in use'
        });
      }
      user.phone = phone;
      user.isPhoneVerified = false; // Reset verification if phone changed
    }

    // Update fields
    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;

    await user.save();

    logger.info('User profile updated', {
      userId: user._id,
      email: user.email,
      updatedFields: Object.keys(req.body),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          isPhoneVerified: user.isPhoneVerified
        }
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating profile'
    });
  }
};

// Export functions directly (they are already defined as exports.functionName)
// No need for additional module.exports since we used exports.functionName syntax
