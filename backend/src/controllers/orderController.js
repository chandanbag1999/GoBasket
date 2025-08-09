const Order = require("../models/Order");

class OrderController {
  // Get user's orders
  async getMyOrders(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, status } = req.query;

      const options = {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        status,
      };

      const orders = await Order.findByUser(userId, options);
      const totalOrders = await Order.countDocuments({
        userId,
        ...(status && { status }),
      });

      res.status(200).json({
        status: "success",
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / parseInt(limit)),
            totalOrders,
            hasMore: parseInt(page) * parseInt(limit) < totalOrders,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get orders error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch orders",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get specific order details
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({ _id: orderId, userId }).populate(
        "items.productId",
        "name images category"
      );

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      res.status(200).json({
        status: "success",
        data: { order },
      });
    } catch (error) {
      console.error("❌ Get order by ID error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch order details",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      const { reason } = req.body;

      const order = await Order.findOne({ _id: orderId, userId });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      if (!order.canCancel()) {
        return res.status(400).json({
          status: "error",
          message: "Order cannot be cancelled",
          code: "CANCELLATION_NOT_ALLOWED",
          currentStatus: order.status,
        });
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = reason || "Cancelled by customer";

      // If payment was completed, mark it for refund processing
      if (order.payment.status === "completed") {
        order.payment.status = "refunded"; // This would trigger refund process
      }

      await order.save();

      console.log(`✅ Order cancelled: ${order.orderNumber}`);

      res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        data: {
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            cancelledAt: order.cancelledAt,
          },
        },
      });
    } catch (error) {
      console.error("❌ Cancel order error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to cancel order",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Track order
  async trackOrder(req, res) {
    try {
      const { orderNumber } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({ orderNumber, userId });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
          code: "ORDER_NOT_FOUND",
        });
      }

      const trackingInfo = {
        orderNumber: order.orderNumber,
        status: order.status,
        currentStatus: this.getStatusDisplay(order.status),
        statusHistory: order.statusHistory,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        timeline: this.generateTimeline(order),
      };

      res.status(200).json({
        status: "success",
        data: { tracking: trackingInfo },
      });
    } catch (error) {
      console.error("❌ Track order error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to track order",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Helper methods
  getStatusDisplay(status) {
    const statusMap = {
      pending: "Order Placed",
      confirmed: "Order Confirmed",
      processing: "Being Prepared",
      shipped: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };

    return statusMap[status] || status;
  }

  generateTimeline(order) {
    const timeline = [];

    timeline.push({
      status: "pending",
      title: "Order Placed",
      timestamp: order.createdAt,
      completed: true,
      description: "Your order has been placed successfully",
    });

    if (
      ["confirmed", "processing", "shipped", "delivered"].includes(order.status)
    ) {
      timeline.push({
        status: "confirmed",
        title: "Order Confirmed",
        timestamp: order.payment.paidAt,
        completed: true,
        description: "Payment confirmed and order accepted",
      });
    }

    if (["processing", "shipped", "delivered"].includes(order.status)) {
      timeline.push({
        status: "processing",
        title: "Preparing Order",
        timestamp: null,
        completed: order.status !== "confirmed",
        description: "Your items are being prepared",
      });
    }

    if (["shipped", "delivered"].includes(order.status)) {
      timeline.push({
        status: "shipped",
        title: "Out for Delivery",
        timestamp: null,
        completed: order.status === "delivered" || order.status === "shipped",
        description: "Order is on the way to you",
      });
    }

    if (order.status === "delivered") {
      timeline.push({
        status: "delivered",
        title: "Delivered",
        timestamp: order.deliveredAt,
        completed: true,
        description: "Order delivered successfully",
      });
    }

    if (order.status === "cancelled") {
      timeline.push({
        status: "cancelled",
        title: "Cancelled",
        timestamp: order.cancelledAt,
        completed: true,
        description: order.cancellationReason || "Order cancelled",
      });
    }

    return timeline;
  }
}

module.exports = new OrderController();
