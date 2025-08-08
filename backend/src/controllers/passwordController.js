const User = require('../models/User');
const tokenService = require('../services/tokenService');
const emailService = require('../services/emailService');
const bcrypt = require('bcrypt');

class PasswordController {

  // Request password reset (send OTP)
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      console.log(`📧 Password reset requested for: ${email}`);

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, you will receive a password reset OTP.'
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(400).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check OTP rate limiting
      const cooldownCheck = await tokenService.canResendOTP(email, 'password_reset', 2);
      if (!cooldownCheck.canResend) {
        return res.status(429).json({
          status: 'error',
          message: cooldownCheck.message,
          code: 'RATE_LIMITED',
          timeLeft: cooldownCheck.timeLeft
        });
      }

      // Generate OTP
      const otp = emailService.generateOTP();
      console.log(`🔢 Generated OTP for ${email}: ${otp}`); // Remove in production

      // Store OTP in Redis (10 minutes expiry)
      const otpStored = await tokenService.storeOTP(email, otp, 'password_reset', 10);
      
      if (!otpStored) {
        console.error('❌ Failed to store OTP in Redis');
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate OTP. Please try again.'
        });
      }

      console.log(`✅ OTP stored successfully for ${email}`);

      // Send OTP email with enhanced error handling
      try {
        console.log(`📧 Attempting to send OTP email to ${email}...`);
        
        const emailResult = await emailService.sendPasswordResetOTP(user, otp);
        
        console.log(`✅ Email queued/sent successfully:`, emailResult);
        
        res.status(200).json({
          status: 'success',
          message: 'Password reset OTP has been sent to your email address.',
          data: {
            email: email.replace(/(.{2})(.*)(?=.{2})/, '$1***'),
            expiresIn: '10 minutes',
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { debugOTP: otp })
          }
        });

      } catch (emailError) {
        console.error('❌ Failed to send reset email:', emailError);
        
        // Even if email fails, don't reveal this to user for security
        res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, you will receive a password reset OTP.',
          note: 'Email may take a few minutes to arrive',
          data: {
            email: email.replace(/(.{2})(.*)(?=.{2})/, '$1***'),
            expiresIn: '10 minutes',
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { debugOTP: otp })
          }
        });
      }

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to process password reset request',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Verify OTP and reset password
  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      console.log(`🔍 Resetting password for: ${email} with OTP: ${otp}`);

      // First check if OTP exists in Redis for debugging
      const otpStatus = await tokenService.getOTPStatus(email, 'password_reset');
      console.log(`🔍 OTP Status for ${email}:`, otpStatus);

      // Verify OTP
      const otpVerification = await tokenService.verifyOTP(email, otp, 'password_reset');
      console.log(`🔍 OTP Verification result:`, otpVerification);
      
      if (!otpVerification.success) {
        return res.status(400).json({
          status: 'error',
          message: otpVerification.message,
          code: otpVerification.code,
          ...(otpVerification.attemptsRemaining && { 
            attemptsRemaining: otpVerification.attemptsRemaining 
          })
        });
      }

      // Find user
      const user = await User.findByEmail(email).select('+password');
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if new password is same as current password
      if (user.password) {
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
          return res.status(400).json({
            status: 'error',
            message: 'New password cannot be the same as your current password',
            code: 'SAME_PASSWORD'
          });
        }
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      // Reset login attempts if any
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      await user.save();

      // Revoke all existing sessions for security
      await tokenService.revokeAllUserSessions(user._id);

      console.log(`✅ Password reset successful for: ${email}`);

      res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully. Please login with your new password.',
        data: {
          userId: user._id,
          email: user.email
        }
      });

    } catch (error) {
      console.error('❌ Reset password error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset password',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Verify OTP only (without resetting password)
  async verifyResetOTP(req, res) {
    try {
      const { email, otp } = req.body;

      console.log(`🔍 Verifying OTP for: ${email} with OTP: ${otp}`);

      // First check if OTP exists in Redis for debugging
      const otpStatus = await tokenService.getOTPStatus(email, 'password_reset');
      console.log(`🔍 OTP Status for ${email}:`, otpStatus);
      
      if (!otpStatus.exists) {
        return res.status(400).json({
          status: 'error',
          message: 'OTP not found or expired',
          code: 'OTP_NOT_FOUND',
          debug: {
            email,
            otpExists: otpStatus.exists,
            timeLeft: otpStatus.timeLeft || 0
          }
        });
      }

      // Verify OTP
      const otpVerification = await tokenService.verifyOTP(email, otp, 'password_reset');
      console.log(`🔍 OTP Verification result:`, otpVerification);
      
      if (!otpVerification.success) {
        return res.status(400).json({
          status: 'error',
          message: otpVerification.message,
          code: otpVerification.code,
          ...(otpVerification.attemptsRemaining && { 
            attemptsRemaining: otpVerification.attemptsRemaining 
          })
        });
      }

      // Store a temporary token for password reset (valid for 5 minutes)
      const resetToken = tokenService.generatePasswordResetToken();
      await tokenService.storeOTP(email, resetToken, 'password_reset_verified', 5);

      console.log(`✅ OTP verified successfully for: ${email}`);

      res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully. You can now reset your password.',
        data: {
          resetToken,
          email: email.replace(/(.{2})(.*)(?=.{2})/, '$1***'),
          expiresIn: '5 minutes'
        }
      });

    } catch (error) {
      console.error('❌ Verify reset OTP error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify OTP',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      console.log(`🔄 Resending OTP for: ${email}`);

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, you will receive a new OTP.'
        });
      }

      // Check OTP rate limiting
      const cooldownCheck = await tokenService.canResendOTP(email, 'password_reset', 2);
      if (!cooldownCheck.canResend) {
        return res.status(429).json({
          status: 'error',
          message: cooldownCheck.message,
          code: 'RATE_LIMITED',
          timeLeft: cooldownCheck.timeLeft
        });
      }

      // Generate new OTP
      const otp = emailService.generateOTP();
      console.log(`🔢 Generated new OTP for ${email}: ${otp}`); // Remove in production

      // Store new OTP in Redis
      const otpStored = await tokenService.storeOTP(email, otp, 'password_reset', 10);
      
      if (!otpStored) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate OTP. Please try again.'
        });
      }

      // Send new OTP email
      try {
        await emailService.sendPasswordResetOTP(user, otp);
        
        console.log(`✅ Password reset OTP resent for: ${email}`);

        res.status(200).json({
          status: 'success',
          message: 'New OTP has been sent to your email address.',
          data: {
            email: email.replace(/(.{2})(.*)(?=.{2})/, '$1***'),
            expiresIn: '10 minutes',
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { debugOTP: otp })
          }
        });

      } catch (emailError) {
        console.error('Failed to resend OTP email:', emailError);
        
        // Don't reveal email failure to user
        res.status(200).json({
          status: 'success',
          message: 'If an account with that email exists, you will receive a new OTP.',
          data: {
            email: email.replace(/(.{2})(.*)(?=.{2})/, '$1***'),
            expiresIn: '10 minutes',
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { debugOTP: otp })
          }
        });
      }

    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to resend OTP',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Change password (for authenticated users)
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      console.log(`🔄 Password change requested for user: ${userId}`);

      // Get user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Check if new password is different
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          status: 'error',
          message: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        });
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      // Revoke all sessions except current one for security
      await tokenService.revokeAllUserSessions(user._id);

      console.log(`✅ Password changed successfully for user: ${userId}`);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully. Please login again.',
        data: {
          userId: user._id
        }
      });

    } catch (error) {
      console.error('❌ Change password error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }

  // Get password reset status (for debugging/testing)
  async getResetStatus(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is required'
        });
      }

      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          status: 'error',
          message: 'This endpoint is only available in development mode'
        });
      }

      const otpStatus = await tokenService.getOTPStatus(email, 'password_reset');
      
      res.status(200).json({
        status: 'success',
        data: otpStatus
      });

    } catch (error) {
      console.error('❌ Get reset status error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to get reset status',
        error: error.message
      });
    }
  }
}

module.exports = new PasswordController();
