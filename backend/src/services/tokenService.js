const jwt = require('jsonwebtoken');
const redisConnection = require('../config/redis');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
    this.redisExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    this.issuer = 'grocery-app';
    this.audience = 'grocery-app-users';
  }

  // Generate device ID from user agent and IP
  generateDeviceId(deviceInfo, ipAddress) {
    const deviceString = `${deviceInfo}-${ipAddress}-${Date.now()}`;
    return crypto.createHash('md5').update(deviceString).digest('hex').substring(0, 12);
  }

  // Generate access token with user data
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      isVerified: user.isVerified,
      tokenType: 'access'
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      subject: user._id.toString()
    });
  }

  // Generate refresh token
  generateRefreshToken(user, deviceId) {
    const payload = {
      userId: user._id,
      email: user.email,
      deviceId: deviceId,
      tokenType: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: this.refreshTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      subject: user._id.toString()
    });
  }

  // Generate complete token pair with Redis storage
  async generateTokenPair(user, deviceInfo = {}) {
    try {
      const deviceId = this.generateDeviceId(
        deviceInfo.deviceInfo || 'unknown',
        deviceInfo.ipAddress || 'unknown'
      );

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user, deviceId);

      const client = redisConnection.getClient();
      
      // Store refresh token with device ID
      const refreshTokenKey = `refresh_token:${user._id}:${deviceId}`;
      await client.setEx(refreshTokenKey, this.redisExpiry, refreshToken);
      
      // Store detailed session info
      const sessionKey = `user_session:${user._id}:${deviceId}`;
      const sessionData = {
        userId: user._id.toString(),
        deviceId: deviceId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        deviceInfo: deviceInfo.deviceInfo || 'unknown',
        ipAddress: deviceInfo.ipAddress || 'unknown',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      await client.setEx(sessionKey, this.redisExpiry, JSON.stringify(sessionData));

      // Keep track of all user devices
      const userDevicesKey = `user_devices:${user._id}`;
      await client.sAdd(userDevicesKey, deviceId);
      await client.expire(userDevicesKey, this.redisExpiry);

      console.log(`✅ Token pair generated for user ${user.email} on device ${deviceId}`);
      
      return { 
        accessToken, 
        refreshToken,
        deviceId,
        expiresIn: this.accessTokenExpiry,
        tokenType: 'Bearer'
      };

    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: this.issuer,
        audience: this.audience
      });

      if (decoded.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: this.issuer,
        audience: this.audience
      });

      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const client = redisConnection.getClient();
      
      const refreshTokenKey = `refresh_token:${decoded.userId}:${decoded.deviceId}`;
      const storedToken = await client.get(refreshTokenKey);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Refresh token not found or invalid');
      }

      const userPayload = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        isVerified: decoded.isVerified
      };

      const newAccessToken = this.generateAccessToken(userPayload);
      
      // Update session activity
      const sessionKey = `user_session:${decoded.userId}:${decoded.deviceId}`;
      const sessionData = await client.get(sessionKey);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        await client.setEx(sessionKey, this.redisExpiry, JSON.stringify(session));
      }

      console.log(`✅ Access token refreshed for user ${decoded.email} on device ${decoded.deviceId}`);

      return { 
        accessToken: newAccessToken,
        expiresIn: this.accessTokenExpiry,
        tokenType: 'Bearer'
      };

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  // Revoke refresh token (single device logout)
  async revokeRefreshToken(userId) {
    try {
      const client = redisConnection.getClient();
      
      // Get all device IDs for the user
      const userDevicesKey = `user_devices:${userId}`;
      const deviceIds = await client.sMembers(userDevicesKey);
      
      if (deviceIds.length === 0) {
        console.log(`✅ No active sessions found for user ${userId}`);
        return true;
      }

      // For single logout, remove the most recent session (or you can implement device detection)
      const deviceId = deviceIds[0]; // Or implement proper device detection
      
      const refreshTokenKey = `refresh_token:${userId}:${deviceId}`;
      const sessionKey = `user_session:${userId}:${deviceId}`;
      
      const results = await Promise.allSettled([
        client.del(refreshTokenKey),
        client.del(sessionKey),
        client.sRem(userDevicesKey, deviceId)
      ]);

      console.log(`✅ Session revoked for user ${userId} on device ${deviceId}`);
      return true;
    } catch (error) {
      console.error('❌ Error revoking refresh token:', error);
      return false;
    }
  }

  // ✅ ADDED: Revoke all user sessions (logout from all devices)
  async revokeAllUserSessions(userId) {
    try {
      const client = redisConnection.getClient();
      
      // Get all device IDs for the user
      const userDevicesKey = `user_devices:${userId}`;
      const deviceIds = await client.sMembers(userDevicesKey);
      
      if (deviceIds.length === 0) {
        console.log(`✅ No active sessions found for user ${userId}`);
        return true;
      }

      // Delete all refresh tokens and sessions for all devices
      const keysToDelete = [];
      
      for (const deviceId of deviceIds) {
        keysToDelete.push(`refresh_token:${userId}:${deviceId}`);
        keysToDelete.push(`user_session:${userId}:${deviceId}`);
      }
      
      // Add the user devices key itself
      keysToDelete.push(userDevicesKey);
      
      // Delete all keys
      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
      }
      
      // Also clean up any OTP-related keys
      await this.clearUserOTPs(userId);

      console.log(`✅ All sessions revoked for user ${userId} (${deviceIds.length} devices)`);
      return true;
    } catch (error) {
      console.error('❌ Error revoking all sessions:', error);
      return false;
    }
  }

  // ✅ ADDED: Revoke specific device session
  async revokeDeviceSession(userId, deviceId) {
    try {
      const client = redisConnection.getClient();
      
      const refreshTokenKey = `refresh_token:${userId}:${deviceId}`;
      const sessionKey = `user_session:${userId}:${deviceId}`;
      const userDevicesKey = `user_devices:${userId}`;
      
      // Check if session exists
      const sessionExists = await client.get(sessionKey);
      
      if (!sessionExists) {
        console.log(`❌ Session not found for user ${userId} on device ${deviceId}`);
        return false;
      }
      
      // Delete the session
      const results = await Promise.allSettled([
        client.del(refreshTokenKey),
        client.del(sessionKey),
        client.sRem(userDevicesKey, deviceId)
      ]);

      console.log(`✅ Session revoked for user ${userId} on device ${deviceId}`);
      return true;
    } catch (error) {
      console.error('❌ Error revoking device session:', error);
      return false;
    }
  }

  // ✅ ADDED: Get all active sessions for a user
  async getUserActiveSessions(userId) {
    try {
      const client = redisConnection.getClient();
      
      // Get all device IDs for the user
      const userDevicesKey = `user_devices:${userId}`;
      const deviceIds = await client.sMembers(userDevicesKey);
      
      if (deviceIds.length === 0) {
        return [];
      }

      const sessions = [];
      
      for (const deviceId of deviceIds) {
        const sessionKey = `user_session:${userId}:${deviceId}`;
        const sessionData = await client.get(sessionKey);
        
        if (sessionData) {
          const session = JSON.parse(sessionData);
          
          sessions.push({
            deviceId: deviceId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity,
            isCurrentDevice: false // You can implement current device detection
          });
        }
      }
      
      // Sort by last activity (most recent first)
      sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      
      return sessions;
    } catch (error) {
      console.error('❌ Error getting user active sessions:', error);
      return [];
    }
  }

  // Get user session info (updated for multi-device)
  async getUserSession(userId) {
    try {
      const client = redisConnection.getClient();
      
      // Get all device IDs
      const userDevicesKey = `user_devices:${userId}`;
      const deviceIds = await client.sMembers(userDevicesKey);
      
      if (deviceIds.length === 0) {
        return null;
      }

      // Get the most recent session (you can modify this logic)
      const deviceId = deviceIds[0];
      const sessionKey = `user_session:${userId}:${deviceId}`;
      const sessionData = await client.get(sessionKey);
      
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('❌ Error getting user session:', error);
      return null;
    }
  }

  // Generate email verification token
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate password reset token
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store OTP in Redis with expiry
  async storeOTP(identifier, otp, type = 'password_reset', expiryMinutes = 10) {
    try {
      const client = redisConnection.getClient();
      const key = `otp:${type}:${identifier}`;
      
      const otpData = {
        otp,
        type,
        identifier,
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
      };
      
      await client.setEx(key, expiryMinutes * 60, JSON.stringify(otpData));
      
      console.log(`✅ OTP stored for ${identifier} (${type}) - Key: ${key}`);
      console.log(`🔍 Stored OTP data:`, otpData);
      return true;
    } catch (error) {
      console.error('❌ Error storing OTP:', error);
      return false;
    }
  }

  // Enhanced verifyOTP method with better debugging
  async verifyOTP(identifier, providedOTP, type = 'password_reset') {
    try {
      const client = redisConnection.getClient();
      const key = `otp:${type}:${identifier}`;
      
      console.log(`🔍 Verifying OTP - Key: ${key}, Provided OTP: ${providedOTP}`);
      
      const data = await client.get(key);
      console.log(`🔍 Redis data for key ${key}:`, data);
      
      if (!data) {
        console.log(`❌ No OTP found in Redis for key: ${key}`);
        return { success: false, message: 'OTP not found or expired', code: 'OTP_NOT_FOUND' };
      }
      
      const otpData = JSON.parse(data);
      console.log(`🔍 Parsed OTP data:`, otpData);
      
      // Check if OTP has expired
      if (new Date() > new Date(otpData.expiresAt)) {
        await client.del(key);
        console.log(`❌ OTP expired for ${identifier}`);
        return { success: false, message: 'OTP has expired', code: 'OTP_EXPIRED' };
      }
      
      // Check max attempts
      if (otpData.attempts >= otpData.maxAttempts) {
        await client.del(key);
        console.log(`❌ Max attempts exceeded for ${identifier}`);
        return { success: false, message: 'Maximum OTP attempts exceeded', code: 'MAX_ATTEMPTS' };
      }
      
      // Verify OTP
      if (otpData.otp !== providedOTP) {
        otpData.attempts += 1;
        const remainingTime = Math.ceil((new Date(otpData.expiresAt) - new Date()) / 1000);
        await client.setEx(key, remainingTime, JSON.stringify(otpData));
        
        console.log(`❌ Invalid OTP for ${identifier}. Attempts: ${otpData.attempts}/${otpData.maxAttempts}`);
        
        return { 
          success: false, 
          message: 'Invalid OTP', 
          code: 'INVALID_OTP',
          attemptsRemaining: otpData.maxAttempts - otpData.attempts
        };
      }
      
      // OTP is valid - delete it (one-time use)
      await client.del(key);
      console.log(`✅ OTP verified successfully for ${identifier}`);
      
      return { 
        success: true, 
        message: 'OTP verified successfully', 
        data: otpData 
      };
      
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return { success: false, message: 'OTP verification failed', code: 'VERIFICATION_ERROR' };
    }
  }

  // Check if OTP can be resent (rate limiting)
  async canResendOTP(identifier, type = 'password_reset', cooldownMinutes = 2) {
    try {
      const client = redisConnection.getClient();
      const cooldownKey = `otp_cooldown:${type}:${identifier}`;
      
      const lastSent = await client.get(cooldownKey);
      
      if (lastSent) {
        const timeLeft = Math.ceil((cooldownMinutes * 60 * 1000 - (Date.now() - parseInt(lastSent))) / 1000);
        if (timeLeft > 0) {
          return { 
            canResend: false, 
            timeLeft, 
            message: `Please wait ${timeLeft} seconds before requesting another OTP` 
          };
        }
      }
      
      await client.setEx(cooldownKey, cooldownMinutes * 60, Date.now().toString());
      
      return { canResend: true };
      
    } catch (error) {
      console.error('❌ Error checking OTP cooldown:', error);
      return { canResend: true };
    }
  }

  // Get OTP status (for debugging/testing)
  async getOTPStatus(identifier, type = 'password_reset') {
    try {
      const client = redisConnection.getClient();
      const key = `otp:${type}:${identifier}`;
      
      console.log(`🔍 Getting OTP status for key: ${key}`);
      
      const data = await client.get(key);
      
      if (!data) {
        console.log(`❌ No OTP found for key: ${key}`);
        return { exists: false };
      }
      
      const otpData = JSON.parse(data);
      console.log(`🔍 Found OTP data:`, otpData);
      
      return {
        exists: true,
        attempts: otpData.attempts,
        maxAttempts: otpData.maxAttempts,
        expiresAt: otpData.expiresAt,
        timeLeft: Math.max(0, Math.ceil((new Date(otpData.expiresAt) - new Date()) / 1000)),
        createdAt: otpData.createdAt,
        otp: process.env.NODE_ENV === 'development' ? otpData.otp : 'hidden'
      };
      
    } catch (error) {
      console.error('❌ Error getting OTP status:', error);
      return { exists: false, error: error.message };
    }
  }

  // Store verification token in Redis
  async storeVerificationToken(userId, token, type = 'email', expiryMinutes = 1440) {
    try {
      const client = redisConnection.getClient();
      const key = `${type}_verification:${token}`;
      const data = {
        userId: userId.toString(),
        token,
        type,
        createdAt: new Date().toISOString()
      };
      
      await client.setEx(key, expiryMinutes * 60, JSON.stringify(data));
      console.log(`✅ Verification token stored: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Error storing verification token:', error);
      return false;
    }
  }

  // Verify verification token from Redis
  async verifyVerificationToken(token, type = 'email') {
    try {
      const client = redisConnection.getClient();
      const key = `${type}_verification:${token}`;
      const data = await client.get(key);
      
      if (!data) {
        console.log(`❌ Verification token not found: ${key}`);
        return null;
      }
      
      await client.del(key);
      console.log(`✅ Verification token verified and deleted: ${key}`);
      
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error verifying verification token:', error);
      return null;
    }
  }

  // Clear all OTPs for a user (cleanup method)
  async clearUserOTPs(identifier) {
    try {
      const client = redisConnection.getClient();
      const patterns = [
        `otp:*:${identifier}`,
        `otp_cooldown:*:${identifier}`
      ];
      
      let deletedCount = 0;
      for (const pattern of patterns) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
          deletedCount += keys.length;
        }
      }
      
      console.log(`✅ Cleared ${deletedCount} OTP-related keys for ${identifier}`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error clearing user OTPs:', error);
      return 0;
    }
  }

  // Get all Redis keys for debugging (development only)
  async getDebugInfo() {
    if (process.env.NODE_ENV !== 'development') {
      return { error: 'Debug info only available in development mode' };
    }

    try {
      const client = redisConnection.getClient();
      
      const otpKeys = await client.keys('otp:*');
      const sessionKeys = await client.keys('user_session:*');
      const tokenKeys = await client.keys('refresh_token:*');
      const deviceKeys = await client.keys('user_devices:*');
      const cooldownKeys = await client.keys('otp_cooldown:*');
      
      const debugInfo = {
        otpKeys: otpKeys.length,
        sessionKeys: sessionKeys.length,
        tokenKeys: tokenKeys.length,
        deviceKeys: deviceKeys.length,
        cooldownKeys: cooldownKeys.length,
        totalKeys: otpKeys.length + sessionKeys.length + tokenKeys.length + deviceKeys.length + cooldownKeys.length
      };

      return debugInfo;
    } catch (error) {
      console.error('❌ Error getting debug info:', error);
      return { error: error.message };
    }
  }
}

module.exports = new TokenService();
