const Razorpay = require('razorpay');
const logger = require('../utils/logger');

class RazorpayService {
  constructor() {
    this.isInitialized = false;
    this.initializationError = null;

    // Check if required environment variables are present
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      this.initializationError = 'Missing Razorpay credentials in environment variables';
      logger.error('❌ Razorpay initialization failed: Missing credentials');
      logger.info('Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in .env file');
      return;
    }

    try {
      // Initialize Razorpay instance
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      this.isInitialized = true;
      logger.info('✅ Razorpay service initialized successfully');

      // Verify credentials asynchronously (non-blocking)
      this.verifyCredentials().catch(error => {
        logger.warn('⚠️ Razorpay credentials verification failed during startup:', error.message);
        logger.info('Payment functionality may be limited. Please check your Razorpay credentials.');
      });

    } catch (error) {
      this.initializationError = error.message;
      logger.error('❌ Razorpay initialization failed:', error.message);
    }
  }

  async verifyCredentials() {
    if (!this.isInitialized) {
      throw new Error('Razorpay service not initialized');
    }

    try {
      // Test API call to verify credentials
      await this.razorpay.payments.all({ count: 1 });
      logger.info('✅ Razorpay credentials verified successfully');
      return true;
    } catch (error) {
      logger.error('❌ Razorpay credentials verification failed:', error.message);

      // Provide helpful error messages based on error type
      if (error.statusCode === 401) {
        logger.info('💡 Hint: Check if your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct');
        logger.info('💡 Ensure you are using the correct environment (test vs live) keys');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        logger.info('💡 Hint: Check your internet connection and firewall settings');
      }

      throw error;
    }
  }

  // Helper method to check if service is ready for use
  isReady() {
    return this.isInitialized && !this.initializationError;
  }

  // Helper method to get initialization status
  getStatus() {
    if (this.initializationError) {
      return { ready: false, error: this.initializationError };
    }
    return { ready: this.isInitialized, error: null };
  }

  // Create order for payment
  async createOrder(orderData) {
    if (!this.isReady()) {
      return {
        success: false,
        error: this.initializationError || 'Razorpay service not initialized'
      };
    }

    try {
      const options = {
        amount: orderData.amount, // Amount in paise (₹1 = 100 paise)
        currency: 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {},
        payment_capture: 1 // Auto capture payment
      };

      const order = await this.razorpay.orders.create(options);

      logger.info('Razorpay order created successfully', {
        orderId: order.id,
        amount: order.amount,
        receipt: order.receipt
      });

      return {
        success: true,
        order
      };

    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    if (!this.isReady()) {
      logger.error('Payment signature verification failed: Razorpay service not initialized');
      return false;
    }

    try {
      const crypto = require('crypto');

      // Create expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Compare signatures
      const isValid = expectedSignature === signature;

      logger.info('Payment signature verification', {
        orderId,
        paymentId,
        isValid
      });

      return isValid;

    } catch (error) {
      logger.error('Payment signature verification error:', error);
      return false;
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    if (!this.isReady()) {
      return {
        success: false,
        error: this.initializationError || 'Razorpay service not initialized'
      };
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment
      };
    } catch (error) {
      logger.error('Get payment details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount, notes = {}) {
    if (!this.isReady()) {
      return {
        success: false,
        error: this.initializationError || 'Razorpay service not initialized'
      };
    }

    try {
      const refundData = {
        amount: amount, // Amount in paise
        notes
      };

      const refund = await this.razorpay.payments.refund(paymentId, refundData);

      logger.info('Payment refund initiated', {
        paymentId,
        refundId: refund.id,
        amount
      });

      return {
        success: true,
        refund
      };

    } catch (error) {
      logger.error('Payment refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all payments for an order
  async getOrderPayments(orderId) {
    if (!this.isReady()) {
      return {
        success: false,
        error: this.initializationError || 'Razorpay service not initialized'
      };
    }

    try {
      const payments = await this.razorpay.orders.fetchPayments(orderId);
      return {
        success: true,
        payments: payments.items
      };
    } catch (error) {
      logger.error('Get order payments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new RazorpayService();
