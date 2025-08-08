const User = require('../models/User');
const tokenService = require('../services/tokenService');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

class AuthController {
  
  // User Registration
  async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        });
      }

      // Check if phone number exists (if provided)
      if (phone) {
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
          return res.status(409).json({
            status: 'error',
            message: 'User with this phone number already exists',
            code: 'PHONE_EXISTS'
          });
        }
      }

      // Create new user
      const newUser = new User({
        email: email.toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || null
      });

      // Generate email verification token
      const emailVerificationToken = tokenService.generateEmailVerificationToken();
      newUser.emailVerificationToken = emailVerificationToken;
      newUser.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save user
      await newUser.save();

      // Store verification token in Redis
      await tokenService.storeVerificationToken(
        newUser._id, 
        emailVerificationToken, 
        'email', 
        1440 // 24 hours in minutes
      );

      // Generate authentication tokens with device info
      const deviceInfo = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      const tokens = await tokenService.generateTokenPair(newUser, {
        deviceInfo,
        ipAddress
      });

      console.log(`✅ User registered successfully: ${email}`);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(newUser);
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
      }

      // Send success response (password excluded by User model transform)
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            fullName: newUser.fullName,
            role: newUser.role,
            isVerified: newUser.isVerified,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt
          },
          tokens
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          status: 'error',
          message: `${field} already exists`,
          code: 'DUPLICATE_FIELD'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // User Login
  async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user and include password field
      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          status: 'error',
          message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verify password
      let isPasswordValid = false;
      try {
        isPasswordValid = await user.comparePassword(password);
      } catch (passwordError) {
        console.error('Password comparison error:', passwordError);
        return res.status(500).json({
          status: 'error',
          message: 'Authentication failed'
        });
      }

      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incLoginAttempts();
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate authentication tokens with device info
      const deviceInfo = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      const tokens = await tokenService.generateTokenPair(user, {
        deviceInfo,
        ipAddress
      });

      console.log(`✅ User logged in successfully: ${email}`);

      // Send success response
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            accountAge: user.accountAge
          },
          tokens
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Login failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Refresh Token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token is required'
        });
      }

      // Refresh the access token
      const tokens = await tokenService.refreshAccessToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: { tokens }
      });

    } catch (error) {
      console.error('❌ Token refresh error:', error);

      let statusCode = 401;
      let message = 'Token refresh failed';

      if (error.message.includes('expired')) {
        message = 'Refresh token expired';
        statusCode = 401;
      } else if (error.message.includes('invalid')) {
        message = 'Invalid refresh token';
        statusCode = 401;
      }

      res.status(statusCode).json({
        status: 'error',
        message,
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  // Logout (single device)
  async logout(req, res) {
    try {
      const userId = req.user._id;
      const deviceInfo = req.headers['user-agent'] || 'current-device';

      // Revoke refresh token from current session
      await tokenService.revokeRefreshToken(userId);

      console.log(`✅ User logged out successfully: ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Logout failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // ✅ ADDED: Logout from all devices
  async logoutAll(req, res) {
    try {
      const userId = req.user._id;

      // Revoke all user sessions from all devices
      const result = await tokenService.revokeAllUserSessions(userId);

      if (result) {
        console.log(`✅ User logged out from all devices: ${req.user.email}`);

        res.status(200).json({
          status: 'success',
          message: 'Successfully logged out from all devices',
          data: {
            userId: userId,
            loggedOutAt: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to logout from all devices'
        });
      }

    } catch (error) {
      console.error('❌ Logout all error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Logout from all devices failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // ✅ ADDED: Get active sessions
  async getActiveSessions(req, res) {
    try {
      const userId = req.user._id;

      // Get all active sessions for the user
      const sessions = await tokenService.getUserActiveSessions(userId);

      res.status(200).json({
        status: 'success',
        message: 'Active sessions retrieved successfully',
        data: {
          userId: userId,
          activeSessionsCount: sessions.length,
          sessions: sessions
        }
      });

    } catch (error) {
      console.error('❌ Get active sessions error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve active sessions',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // ✅ ADDED: Logout from specific device
  async logoutFromDevice(req, res) {
    try {
      const userId = req.user._id;
      const { deviceId } = req.params;

      if (!deviceId) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID is required'
        });
      }

      // Revoke session for specific device
      const result = await tokenService.revokeDeviceSession(userId, deviceId);

      if (result) {
        console.log(`✅ User logged out from device ${deviceId}: ${req.user.email}`);

        res.status(200).json({
          status: 'success',
          message: `Successfully logged out from device`,
          data: {
            userId: userId,
            deviceId: deviceId,
            loggedOutAt: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: 'Device session not found'
        });
      }

    } catch (error) {
      console.error('❌ Logout from device error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to logout from device',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Verify Email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Verification token is required'
        });
      }

      // Verify token from Redis
      const tokenData = await tokenService.verifyVerificationToken(token, 'email');
      
      if (!tokenData) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        });
      }

      // Find and update user
      const user = await User.findById(tokenData.userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already verified'
        });
      }

      // Mark user as verified
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      console.log(`✅ Email verified successfully: ${user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            isVerified: user.isVerified
          }
        }
      });

    } catch (error) {
      console.error('❌ Email verification error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Email verification failed',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Get Current User Profile
  async getProfile(req, res) {
    try {
      const user = req.user;

      // Get session info from Redis
      const session = await tokenService.getUserSession(user._id);

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            addresses: user.addresses,
            lastLogin: user.lastLogin,
            accountAge: user.accountAge,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          session
        }
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user profile',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
}

module.exports = new AuthController();
