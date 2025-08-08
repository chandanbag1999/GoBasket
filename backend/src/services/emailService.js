const nodemailer = require('nodemailer');
const Bull = require('bull');

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailQueue = null;
    this.init();
  }

  async init() {
    try {
      // Initialize email transporter
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service connected and verified');

      // ✅ FIXED: Use same Redis URL as main connection
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('⚠️ REDIS_URL not found, email queue will be disabled');
        return;
      }

      // Initialize Bull queue with correct Redis URL
      this.emailQueue = new Bull('email queue', redisUrl, {
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Enhanced job processor
      this.emailQueue.process('send-email', 1, this.processEmailJob.bind(this));

      // Add comprehensive event listeners
      this.emailQueue.on('completed', (job, result) => {
        console.log(`✅ Email job ${job.id} completed:`, result);
      });

      this.emailQueue.on('failed', (job, err) => {
        console.error(`❌ Email job ${job.id} failed:`, err.message);
      });

      this.emailQueue.on('stalled', (job) => {
        console.warn(`⚠️ Email job ${job.id} stalled`);
      });

      this.emailQueue.on('error', (error) => {
        console.error('❌ Email queue error:', error.message);
        // Don't exit process, just log the error
      });

      this.emailQueue.on('ready', () => {
        console.log('✅ Email queue connected to Redis successfully');
      });

      console.log('✅ Email queue initialized');

    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      // Don't exit the process, but mark service as unavailable
      this.transporter = null;
      this.emailQueue = null;
    }
  }

  // Enhanced email processing
  async processEmailJob(job) {
    const { to, subject, html, text } = job.data;
    
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'Grocery App'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        headers: {
          'X-Mailer': 'Grocery App',
          'X-Priority': '3',
        },
      };

      console.log(`📧 Sending email to ${to}...`);
      
      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 30000)
        )
      ]);
      
      console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId,
        to,
        subject 
      };
      
    } catch (error) {
      console.error(`❌ Email send failed to ${to}:`, error.message);
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Enhanced queue email with better error handling
  async queueEmail(emailData, options = {}) {
    try {
      if (!this.emailQueue) {
        // If queue is not available, try direct send
        console.warn('⚠️ Queue not available, attempting direct send...');
        return await this.sendEmailDirect(emailData);
      }

      const job = await this.emailQueue.add('send-email', emailData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
        timeout: 60000,
        ...options
      });

      console.log(`📬 Email job ${job.id} queued for ${emailData.to}`);
      return job;
      
    } catch (error) {
      console.error('❌ Failed to queue email:', error);
      
      // Fallback to direct send
      console.log('🔄 Attempting direct send as fallback...');
      return await this.sendEmailDirect(emailData);
    }
  }

  // Direct email send as fallback
  async sendEmailDirect(emailData) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not available');
      }

      const { to, subject, html, text } = emailData;
      
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'Grocery App'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      };

      console.log(`📧 Direct sending email to ${to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Direct email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('❌ Direct email send failed:', error);
      throw error;
    }
  }

  // Send OTP for password reset (existing method - no changes needed)
  async sendPasswordResetOTP(user, otp) {
    const subject = '🔒 Password Reset OTP - Grocery App';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #FF5722; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Password Reset OTP 🔒</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hello ${user.firstName}!</h2>
          
          <p>You requested a password reset for your Grocery App account.</p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #FF5722;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your OTP is:</p>
            <h1 style="margin: 10px 0; font-size: 32px; color: #FF5722; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #666;">This OTP is valid for 10 minutes only</p>
          </div>
          
          <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #E65100;">🔐 Security Tips:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
              <li>Never share this OTP with anyone</li>
              <li>Our team will never ask for your OTP</li>
              <li>If you didn't request this, ignore this email</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, please ignore this email. Your account remains secure.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© 2025 Grocery App. Made with ❤️ for secure deliveries.</p>
        </div>
      </div>
    `;

    const text = `
      Password Reset OTP - Grocery App
      
      Hello ${user.firstName}!
      
      Your password reset OTP is: ${otp}
      
      This OTP is valid for 10 minutes only.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      Grocery App Team
    `;

    return this.queueEmail({
      to: user.email,
      subject,
      html,
      text
    });
  }

  // Health check method
  async healthCheck() {
    try {
      const status = {
        transporter: this.transporter ? 'connected' : 'disconnected',
        queue: this.emailQueue ? 'connected' : 'disconnected'
      };

      if (this.transporter) {
        await this.transporter.verify();
        status.transporter = 'verified';
      }

      if (this.emailQueue) {
        const queueStatus = {
          waiting: await this.emailQueue.getWaiting().then(jobs => jobs.length).catch(() => 0),
          active: await this.emailQueue.getActive().then(jobs => jobs.length).catch(() => 0),
          failed: await this.emailQueue.getFailed().then(jobs => jobs.length).catch(() => 0),
        };
        status.queueStats = queueStatus;
      }

      return {
        status: 'healthy',
        services: status
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

module.exports = new EmailService();
