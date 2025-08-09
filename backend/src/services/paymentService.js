const Razorpay = require("razorpay");
const crypto = require("crypto");

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  }

  // Create order for payment
  async createOrder(orderData) {
    try {
      const { amount, currency = "INR", receipt, notes = {} } = orderData;

      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes: {
          ...notes,
          created_by: "grocery_app",
          timestamp: new Date().toISOString(),
        },
      };

      console.log("🔄 Creating Razorpay order:", options);

      const order = await this.razorpay.orders.create(options);

      console.log("✅ Razorpay order created:", order.id);

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      };
    } catch (error) {
      console.error("❌ Error creating Razorpay order:", error);
      throw new Error(`Payment order creation failed: ${error.message}`);
    }
  }

  // Verify payment signature
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        paymentData;

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      console.log(
        `🔐 Payment signature verification: ${
          isAuthentic ? "SUCCESS" : "FAILED"
        }`
      );

      return {
        success: isAuthentic,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      };
    } catch (error) {
      console.error("❌ Error verifying payment signature:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch payment details
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        payment: {
          id: payment.id,
          entity: payment.entity,
          amount: payment.amount / 100, // Convert from paise
          currency: payment.currency,
          status: payment.status,
          order_id: payment.order_id,
          method: payment.method,
          captured: payment.captured,
          created_at: payment.created_at,
          email: payment.email,
          contact: payment.contact,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching payment details:", error);
      throw error;
    }
  }

  // Capture payment (if needed)
  async capturePayment(paymentId, amount) {
    try {
      const capture = await this.razorpay.payments.capture(
        paymentId,
        amount * 100
      );

      return {
        success: true,
        payment: {
          id: capture.id,
          amount: capture.amount / 100,
          currency: capture.currency,
          status: capture.status,
          captured_at: capture.captured_at,
        },
      };
    } catch (error) {
      console.error("❌ Error capturing payment:", error);
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId, amount, notes = {}) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes,
      });

      console.log(
        `✅ Refund processed: ${refund.id} for amount: ${refund.amount / 100}`
      );

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          payment_id: refund.payment_id,
          status: refund.status,
          created_at: refund.created_at,
        },
      };
    } catch (error) {
      console.error("❌ Error processing refund:", error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body, signature) {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      console.error("❌ Error verifying webhook signature:", error);
      return false;
    }
  }

  // Generate payment receipt
  generateReceipt(orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `GROCERY_${orderId}_${timestamp}_${random}`;
  }

  // Validate payment amount
  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    if (amount < 1) {
      throw new Error("Minimum payment amount is ₹1");
    }

    if (amount > 500000) {
      throw new Error("Maximum payment amount is ₹5,00,000");
    }

    return true;
  }

  // Format currency
  formatCurrency(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }
}

module.exports = new PaymentService();
