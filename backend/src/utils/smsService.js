const logger = require('./logger');

class SMSService {
  constructor() {
    // In production, you would use services like:
    // - Twilio
    // - AWS SNS
    // - TextLocal
    // - MSG91
    
    // For now, we'll simulate SMS sending
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Send OTP via SMS
  async sendOTP(phone, otp, userName) {
    try {
      if (this.isProduction) {
        // For now, just log in production
        logger.info('SMS would be sent in production', {
          phone,
          otp,
          service: 'production-sms-service'
        });
        
        return { success: true, messageId: 'prod-simulation' };
      } else {
        // Development mode - just log the OTP
        logger.info('📱 SMS OTP (Development Mode)', {
          phone,
          otp,
          userName,
          message: `Hi ${userName}, your Quick Commerce OTP is: ${otp}. Valid for 5 minutes.`
        });
        
        console.log(`\n🔔 SMS SENT (Development Mode)`);
        console.log(`📱 Phone: ${phone}`);
        console.log(`🔑 OTP: ${otp}`);
        console.log(`👤 User: ${userName}`);
        console.log(`⏰ Valid for: 5 minutes\n`);
        
        return { success: true, messageId: 'dev-simulation' };
      }
    } catch (error) {
      logger.error('SMS send failed:', {
        phone,
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  }

  // Send welcome SMS
  async sendWelcomeSMS(phone, userName) {
    try {
      const message = `Welcome to Quick Commerce, ${userName}! 🎉 Start ordering from your favorite restaurants now. Download our app for the best experience.`;
      
      if (this.isProduction) {
        // Production SMS sending logic
        logger.info('Welcome SMS would be sent in production', {
          phone,
          userName
        });
        return { success: true };
      } else {
        logger.info('📱 Welcome SMS (Development Mode)', {
          phone,
          userName,
          message
        });
        
        console.log(`\n📱 Welcome SMS sent to ${phone}`);
        console.log(`Message: ${message}\n`);
        
        return { success: true };
      }
    } catch (error) {
      logger.error('Welcome SMS failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SMSService();
