const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["email", "sms", "push", "in_app"],
      required: true,
      index: true,
    },

    // Recipients
    recipients: {
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      segments: [
        {
          type: String,
          enum: [
            "all_users",
            "new_users",
            "vip_users",
            "inactive_users",
            "location_based",
          ],
        },
      ],
      customEmails: [String], // For external recipients
      customPhones: [String],
    },

    // Content
    content: {
      subject: String, // For email/push
      title: String, // For push/in-app
      message: { type: String, required: true },
      html: String, // For email
      templateId: String, // Reference to email template
      attachments: [
        {
          filename: String,
          url: String,
          contentType: String,
        },
      ],
    },

    // Scheduling
    scheduling: {
      sendAt: { type: Date, default: Date.now },
      timezone: { type: String, default: "Asia/Kolkata" },
      isScheduled: { type: Boolean, default: false },
      recurring: {
        enabled: { type: Boolean, default: false },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "monthly"],
          default: "daily",
        },
        endDate: Date,
      },
    },

    // Delivery tracking
    delivery: {
      status: {
        type: String,
        enum: [
          "pending",
          "processing",
          "sent",
          "delivered",
          "failed",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },
      sentAt: Date,
      deliveredAt: Date,
      failedAt: Date,
      attempts: { type: Number, default: 0 },
      errorMessage: String,

      // Detailed tracking
      deliveryDetails: [
        {
          recipient: String, // email/phone/userId
          status: String,
          deliveredAt: Date,
          errorMessage: String,
          providerId: String, // External service ID
        },
      ],
    },

    // Analytics
    analytics: {
      totalSent: { type: Number, default: 0 },
      totalDelivered: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
      openRate: { type: Number, default: 0 }, // For email
      clickRate: { type: Number, default: 0 }, // For email/push
      unsubscribeCount: { type: Number, default: 0 },
    },

    // Trigger information
    trigger: {
      event: String, // order_placed, payment_failed, etc.
      entityId: String, // Order ID, User ID, etc.
      automated: { type: Boolean, default: false },
    },

    // Administrative
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
notificationSchema.virtual("deliveryRate").get(function () {
  return this.analytics.totalSent > 0
    ? (this.analytics.totalDelivered / this.analytics.totalSent) * 100
    : 0;
});

notificationSchema.virtual("isOverdue").get(function () {
  return (
    this.scheduling.sendAt < new Date() && this.delivery.status === "pending"
  );
});

// Instance methods
notificationSchema.methods.markAsSent = function () {
  this.delivery.status = "sent";
  this.delivery.sentAt = new Date();
  return this;
};

notificationSchema.methods.markAsDelivered = function (recipientDetails = []) {
  this.delivery.status = "delivered";
  this.delivery.deliveredAt = new Date();

  if (recipientDetails.length > 0) {
    this.delivery.deliveryDetails = recipientDetails;
    this.analytics.totalDelivered = recipientDetails.filter(
      (r) => r.status === "delivered"
    ).length;
    this.analytics.totalFailed = recipientDetails.filter(
      (r) => r.status === "failed"
    ).length;
  }

  return this;
};

notificationSchema.methods.markAsFailed = function (error) {
  this.delivery.status = "failed";
  this.delivery.failedAt = new Date();
  this.delivery.errorMessage = error;
  this.analytics.totalFailed += 1;
  return this;
};

// Static methods
notificationSchema.statics.findPendingNotifications = function () {
  return this.find({
    "delivery.status": "pending",
    "scheduling.sendAt": { $lte: new Date() },
  }).populate("recipients.users", "email phone firstName");
};

notificationSchema.statics.findByType = function (type, limit = 50) {
  return this.find({ type })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "firstName lastName email");
};

notificationSchema.statics.getAnalytics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$type",
        totalNotifications: { $sum: 1 },
        totalSent: { $sum: "$analytics.totalSent" },
        totalDelivered: { $sum: "$analytics.totalDelivered" },
        totalFailed: { $sum: "$analytics.totalFailed" },
        avgOpenRate: { $avg: "$analytics.openRate" },
        avgClickRate: { $avg: "$analytics.clickRate" },
      },
    },
  ]);
};

// Indexes
notificationSchema.index({ type: 1, "delivery.status": 1 });
notificationSchema.index({ "scheduling.sendAt": 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ "recipients.users": 1 });

module.exports = mongoose.model("Notification", notificationSchema);
