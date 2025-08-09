const Order = require("../models/Order");
const Cart = require("../models/Cart");
const paymentService = require("../services/paymentService");
const emailService = require("../services/emailService");

class PaymentController {
  // Create payment order
  async createOrder(req, res) {
    try {
      const userId = req.user._id;
      const {
        cartItems,
        shippingAddress,
        paymentMethod = "razorpay",
      } = req.body;

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Cart is empty",
          code: "EMPTY_CART",
        });
      }

      // Calculate totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = Math.round(subtotal * 0.05); // 5% tax
      const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
      const totalAmount = subtotal + tax + deliveryFee;

      // Validate amount
      paymentService.validateAmount(totalAmount);

      // Generate order number
      const orderNumber = Order.generateOrderNumber();

      // Create order document
      const orderData = {
        orderNumber,
        userId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit || "pcs",
          subtotal: item.price * item.quantity,
        })),
        subtotal,
        tax,
        deliveryFee,
        discount: 0,
        totalAmount,
        shippingAddress,
        payment: {
          method: paymentMethod,
          status: "pending",
        },
        status: "pending",
        source: req.headers["user-agent"]?.includes("Mobile")
          ? "mobile"
          : "web",
      };

      const order = new Order(orderData);
      await order.save();

      // Create payment order if not COD
      if (paymentMethod === "razorpay") {
        const receipt = paymentService.generateReceipt(order._id);

        const paymentOrder = await paymentService.createOrder({
          amount: totalAmount,
          currency: "INR",
          receipt,
          notes: {
            orderId: order._id.toString(),
            userId: userId.toString(),
            orderNumber,
          },
        });

        // Update order with Razorpay order ID
        order.payment.razorpayOrderId = paymentOrder.orderId;
        await order.save();

        console.log(
          `✅ Order created: ${orderNumber} with payment order: ${paymentOrder.orderId}`
        );

        res.status(201).json({
          status: "success",
          message: "Order created successfully",
          data: {
            order: {
              id: order._id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              items: order.items,
              shippingAddress: order.shippingAddress,
            },
            paymentOrder: {
              id: paymentOrder.orderId,
              amount: paymentOrder.amount,
              currency: paymentOrder.currency,
            },
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          },
        });
      } else {
        // COD order
        console.log(`✅ COD Order created: ${orderNumber}`);

        res.status(201).json({
          status: "success",
          message: "COD Order created successfully",
          data: {
            order: {
              id: order._id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              items: order.items,
              paymentMethod: "cod",
            },
          },
        });
      }
    } catch (error) {
      console.error("❌ Create order error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to create order",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Verify payment and update order
  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !orderId
      ) {
        return res.status(400).json({
          status: "error",
          message: "Missing payment verification data",
          code: "MISSING_PAYMENT_DATA",
        });
      }

      // Find order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      // Verify signature
      const verification = paymentService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!verification.success) {
        // Update order as failed
        order.payment.status = "failed";
        order.payment.failureReason = "Invalid signature";
        await order.save();

        return res.status(400).json({
          status: "error",
          message: "Payment verification failed",
          code: "INVALID_SIGNATURE",
        });
      }

      // Get payment details from Razorpay
      const paymentDetails = await paymentService.getPaymentDetails(
        razorpay_payment_id
      );

      if (!paymentDetails.success) {
        return res.status(400).json({
          status: "error",
          message: "Failed to fetch payment details",
          code: "PAYMENT_FETCH_FAILED",
        });
      }

      // Update order with payment success
      order.payment.status = "completed";
      order.payment.razorpayPaymentId = razorpay_payment_id;
      order.payment.razorpaySignature = razorpay_signature;
      order.payment.transactionId = razorpay_payment_id;
      order.payment.paidAt = new Date();
      order.status = "confirmed";

      await order.save();

      // Clear user's cart
      await Cart.findOneAndDelete({ userId: order.userId });

      // Send confirmation email
      try {
        await this.sendOrderConfirmationEmail(order);
      } catch (emailError) {
        console.warn("Failed to send order confirmation email:", emailError);
      }

      console.log(`✅ Payment verified for order: ${order.orderNumber}`);

      res.status(200).json({
        status: "success",
        message: "Payment verified successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            paymentStatus: order.payment.status,
            paidAt: order.payment.paidAt,
          },
        },
      });
    } catch (error) {
      console.error("❌ Payment verification error:", error);

      res.status(500).json({
        status: "error",
        message: "Payment verification failed",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Handle payment failure
  async paymentFailed(req, res) {
    try {
      const { orderId, reason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      order.payment.status = "failed";
      order.payment.failureReason = reason || "Payment failed";
      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = "Payment failed";

      await order.save();

      console.log(`❌ Payment failed for order: ${order.orderNumber}`);

      res.status(200).json({
        status: "success",
        message: "Payment failure recorded",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.payment.status,
          },
        },
      });
    } catch (error) {
      console.error("❌ Payment failure handling error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to handle payment failure",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { amount, reason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      if (!order.canRefund()) {
        return res.status(400).json({
          status: "error",
          message: "Order is not eligible for refund",
          code: "REFUND_NOT_ELIGIBLE",
        });
      }

      // Process refund with Razorpay
      const refundResult = await paymentService.processRefund(
        order.payment.razorpayPaymentId,
        amount || order.totalAmount,
        { reason, orderId: order.orderNumber }
      );

      if (refundResult.success) {
        order.payment.status = "refunded";
        order.status = "refunded";
        await order.save();

        console.log(`✅ Refund processed for order: ${order.orderNumber}`);

        res.status(200).json({
          status: "success",
          message: "Refund processed successfully",
          data: {
            refund: refundResult.refund,
            order: {
              id: order._id,
              orderNumber: order.orderNumber,
              status: order.status,
            },
          },
        });
      } else {
        throw new Error("Refund processing failed");
      }
    } catch (error) {
      console.error("❌ Refund processing error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to process refund",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(order) {
    try {
      const user = await require("../models/User").findById(order.userId);
      if (!user) return;

      const itemsHtml = order.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.subtotal}</td>
        </tr>
      `
        )
        .join("");

      const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>✅ Order Confirmed!</h1>
            <p>Order #${order.orderNumber}</p>
          </div>
          
          <div style="padding: 20px;">
            <h2>Hello ${user.firstName}!</h2>
            <p>Thank you for your order! Your payment has been confirmed and we're preparing your items.</p>
            
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3>Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #ddd;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="font-weight: bold; background: #f0f0f0;">
                    <td colspan="3" style="padding: 10px; text-align: right;">Total Amount:</td>
                    <td style="padding: 10px; text-align: right;">₹${order.totalAmount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3>🚚 Delivery Information</h3>
              <p><strong>Address:</strong> ${order.shippingAddress.line1}, ${order.shippingAddress.city}</p>
              <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
              <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
            </div>
          </div>
        </div>
      `;

      await emailService.queueEmail({
        to: user.email,
        subject: `🛍️ Order Confirmed - ${order.orderNumber} | Grocery App`,
        html,
      });
    } catch (error) {
      console.error("❌ Failed to send order confirmation email:", error);
    }
  }
}

module.exports = new PaymentController();
