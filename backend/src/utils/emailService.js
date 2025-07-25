const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    // Create email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Don't verify connection during initialization to avoid startup crashes
    // this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully');
    } catch (error) {
      logger.error('❌ Email service connection failed:', error.message);
    }
  }

  // Send email with template
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'Quick Commerce'} <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: options.email,
        subject: options.subject,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      logger.error('Email send failed:', {
        to: options.email,
        subject: options.subject,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Welcome email template
  async sendWelcomeEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Quick Commerce</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Quick Commerce!</h1>
            <p>Your account has been created successfully</p>
          </div>
          <div class="content">
            <h2>Hi ${user.name}! 👋</h2>
            <p>Thank you for joining <strong>Quick Commerce</strong> - your favorite food delivery platform!</p>
            
            <div class="highlight">
              <strong>📧 Please verify your email address to get started:</strong>
            </div>
            
            <p>Click the button below to verify your email address and activate your account:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">✅ Verify Email Address</a>
            </div>
            
            <p><strong>Account Details:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ')}</li>
              <li><strong>Registration Date:</strong> ${new Date(user.createdAt).toLocaleDateString()}</li>
            </ul>
            
            <div class="highlight">
              <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security.
            </div>
            
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${verificationUrl}
            </p>
            
            <p>If you didn't create this account, please ignore this email or contact our support team.</p>
          </div>
          <div class="footer">
            <p>📱 Download our app | 🌐 Visit our website | 📞 Contact support</p>
            <p>&copy; 2025 Quick Commerce. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Quick Commerce!
      
      Hi ${user.name},
      
      Thank you for joining Quick Commerce! Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      Account Details:
      - Name: ${user.name}
      - Email: ${user.email}
      - Role: ${user.role}
      
      If you didn't create this account, please ignore this email.
      
      Best regards,
      Quick Commerce Team
    `;

    return await this.sendEmail({
      email: user.email,
      subject: '🎉 Welcome to Quick Commerce - Please Verify Your Email',
      html,
      text
    });
  }

  // Password reset email template
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Quick Commerce</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .security { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #17a2b8; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
            <p>Someone requested a password reset for your account</p>
          </div>
          <div class="content">
            <h2>Hi ${user.name}! 👋</h2>
            <p>We received a request to reset the password for your Quick Commerce account.</p>
            
            <div class="warning">
              <strong>⚠️ If you didn't request this, please ignore this email.</strong> Your password will remain unchanged.
            </div>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">🔑 Reset Password</a>
            </div>
            
            <div class="security">
              <strong>🔐 Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>10 minutes</strong></li>
                <li>Can only be used once</li>
                <li>Request made at: ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>🚨 Didn't request this?</strong><br>
              If you didn't request a password reset, your account may be at risk. Please:
              <ul>
                <li>Change your password immediately</li>
                <li>Check your account for unauthorized activity</li>
                <li>Contact our support team</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>📞 Need help? Contact our support team</p>
            <p>&copy; 2025 Quick Commerce. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - Quick Commerce
      
      Hi ${user.name},
      
      We received a request to reset your password. If you requested this, click the link below:
      
      ${resetUrl}
      
      This link will expire in 10 minutes and can only be used once.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      For security reasons, if you believe your account may be compromised, please contact our support team immediately.
      
      Best regards,
      Quick Commerce Security Team
    `;

    return await this.sendEmail({
      email: user.email,
      subject: '🔒 Password Reset Request - Quick Commerce',
      html,
      text
    });
  }

  // Email verification success
  async sendEmailVerificationSuccess(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email Verified Successfully!</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${user.name}! 🎉</h2>
            <div class="success">
              <strong>Your email address has been verified successfully!</strong>
            </div>
            <p>You can now enjoy all features of Quick Commerce:</p>
            <ul>
              <li>✅ Order from your favorite restaurants</li>
              <li>✅ Track orders in real-time</li>
              <li>✅ Save multiple addresses</li>
              <li>✅ Earn loyalty points</li>
              <li>✅ Get exclusive offers</li>
            </ul>
            <p>Start exploring and place your first order!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      email: user.email,
      subject: '✅ Email Verified - Welcome to Quick Commerce!',
      html
    });
  }
}

// Export class instead of instance to avoid initialization during require
module.exports = EmailService;
