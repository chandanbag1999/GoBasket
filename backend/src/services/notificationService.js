const Notification = require("../models/Notification");
const emailService = require("./emailService");
const User = require("../models/User");

class NotificationService {
  // Send notification
  async sendNotification(notificationData) {
    try {
      console.log(
        `📨 Sending ${notificationData.type} notification: ${
          notificationData.content.subject || notificationData.content.title
        }`
      );

      // Create notification record
      const notification = new Notification(notificationData);
      await notification.save();

      // Get recipients
      const recipients = await this.resolveRecipients(notification.recipients);

      if (recipients.length === 0) {
        notification.delivery.status = "failed";
        notification.delivery.errorMessage = "No valid recipients found";
        await notification.save();
        return { success: false, message: "No recipients found" };
      }

      // Send based on type
      let result;
      switch (notification.type) {
        case "email":
          result = await this.sendEmailNotification(notification, recipients);
          break;
        case "sms":
          result = await this.sendSMSNotification(notification, recipients);
          break;
        case "push":
          result = await this.sendPushNotification(notification, recipients);
          break;
        case "in_app":
          result = await this.sendInAppNotification(notification, recipients);
          break;
        default:
          throw new Error(
            `Unsupported notification type: ${notification.type}`
          );
      }

      // Update notification status
      if (result.success) {
        notification.markAsDelivered(result.deliveryDetails);
        notification.analytics.totalSent = recipients.length;
      } else {
        notification.markAsFailed(result.error);
      }

      await notification.save();

      console.log(
        `✅ Notification sent successfully to ${recipients.length} recipients`
      );
      return result;
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmailNotification(notification, recipients) {
    try {
      const emailPromises = recipients.map((recipient) => {
        return emailService.queueEmail({
          to: recipient.email,
          subject: notification.content.subject,
          text: notification.content.message,
          html:
            notification.content.html ||
            `<p>${notification.content.message}</p>`,
          attachments: notification.content.attachments,
        });
      });

      const results = await Promise.allSettled(emailPromises);

      const deliveryDetails = results.map((result, index) => ({
        recipient: recipients[index].email,
        status: result.status === "fulfilled" ? "delivered" : "failed",
        deliveredAt: result.status === "fulfilled" ? new Date() : null,
        errorMessage:
          result.status === "rejected" ? result.reason.message : null,
      }));

      const successCount = deliveryDetails.filter(
        (d) => d.status === "delivered"
      ).length;

      return {
        success: successCount > 0,
        deliveryDetails,
        successCount,
        failureCount: deliveryDetails.length - successCount,
      };
    } catch (error) {
      console.error("❌ Error sending email notifications:", error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  async sendSMSNotification(notification, recipients) {
    try {
      // SMS service integration would go here
      // For now, returning mock implementation
      console.log("📱 SMS sending not implemented yet");

      const deliveryDetails = recipients.map((recipient) => ({
        recipient: recipient.phone,
        status: "delivered",
        deliveredAt: new Date(),
      }));

      return {
        success: true,
        deliveryDetails,
        successCount: recipients.length,
        failureCount: 0,
      };
    } catch (error) {
      console.error("❌ Error sending SMS notifications:", error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification
  async sendPushNotification(notification, recipients) {
    try {
      // Push notification service integration would go here
      // For now, returning mock implementation
      console.log("🔔 Push notification sending not implemented yet");

      const deliveryDetails = recipients.map((recipient) => ({
        recipient: recipient.userId || recipient.email,
        status: "delivered",
        deliveredAt: new Date(),
      }));

      return {
        success: true,
        deliveryDetails,
        successCount: recipients.length,
        failureCount: 0,
      };
    } catch (error) {
      console.error("❌ Error sending push notifications:", error);
      return { success: false, error: error.message };
    }
  }

  // Send in-app notification
  async sendInAppNotification(notification, recipients) {
    try {
      // In-app notifications would be stored in database
      // and retrieved by frontend when user logs in
      console.log("📥 In-app notification created");

      const deliveryDetails = recipients.map((recipient) => ({
        recipient: recipient.userId || recipient.email,
        status: "delivered",
        deliveredAt: new Date(),
      }));

      return {
        success: true,
        deliveryDetails,
        successCount: recipients.length,
        failureCount: 0,
      };
    } catch (error) {
      console.error("❌ Error creating in-app notifications:", error);
      return { success: false, error: error.message };
    }
  }

  // Resolve recipients from segments and user IDs
  async resolveRecipients(recipientConfig) {
    try {
      let recipients = [];

      // Add specific users
      if (recipientConfig.users && recipientConfig.users.length > 0) {
        const users = await User.find({
          _id: { $in: recipientConfig.users },
          deletedAt: null,
        }).select("email phone firstName lastName");

        recipients.push(
          ...users.map((user) => ({
            userId: user._id,
            email: user.email,
            phone: user.phone,
            name: user.firstName + " " + user.lastName,
          }))
        );
      }

      // Add segment-based recipients
      if (recipientConfig.segments && recipientConfig.segments.length > 0) {
        for (const segment of recipientConfig.segments) {
          const segmentUsers = await this.getUsersBySegment(segment);
          recipients.push(...segmentUsers);
        }
      }

      // Add custom emails
      if (
        recipientConfig.customEmails &&
        recipientConfig.customEmails.length > 0
      ) {
        recipientConfig.customEmails.forEach((email) => {
          recipients.push({
            email,
            name: "Customer",
          });
        });
      }

      // Add custom phones
      if (
        recipientConfig.customPhones &&
        recipientConfig.customPhones.length > 0
      ) {
        recipientConfig.customPhones.forEach((phone) => {
          recipients.push({
            phone,
            name: "Customer",
          });
        });
      }

      // Remove duplicates based on email
      const uniqueRecipients = recipients.filter(
        (recipient, index, self) =>
          index === self.findIndex((r) => r.email === recipient.email)
      );

      return uniqueRecipients;
    } catch (error) {
      console.error("❌ Error resolving recipients:", error);
      return [];
    }
  }

  // Get users by segment
  async getUsersBySegment(segment) {
    try {
      let query = { deletedAt: null };

      switch (segment) {
        case "all_users":
          query = { deletedAt: null };
          break;

        case "new_users":
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query.createdAt = { $gte: sevenDaysAgo };
          break;

        case "vip_users":
          // Define VIP criteria - users with high order value or count
          // This would need to be implemented based on business logic
          query = { deletedAt: null }; // Placeholder
          break;

        case "inactive_users":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query.lastLogin = { $lt: thirtyDaysAgo };
          break;
      }

      const users = await User.find(query)
        .select("email phone firstName lastName")
        .limit(1000); // Limit for performance

      return users.map((user) => ({
        userId: user._id,
        email: user.email,
        phone: user.phone,
        name: user.firstName + " " + user.lastName,
      }));
    } catch (error) {
      console.error("❌ Error getting users by segment:", error);
      return [];
    }
  }

  // Send automated notifications
  async sendAutomatedNotification(trigger, entityId, customData = {}) {
    try {
      console.log(`🤖 Sending automated notification for trigger: ${trigger}`);

      const templates = this.getNotificationTemplates();
      const template = templates[trigger];

      if (!template) {
        console.warn(`No template found for trigger: ${trigger}`);
        return { success: false, message: "Template not found" };
      }

      // Prepare notification data
      const notificationData = {
        type: template.type,
        recipients: await this.getRecipientsForTrigger(trigger, entityId),
        content: {
          subject: this.processTemplate(template.subject, customData),
          message: this.processTemplate(template.message, customData),
          html: template.html
            ? this.processTemplate(template.html, customData)
            : undefined,
        },
        trigger: {
          event: trigger,
          entityId,
          automated: true,
        },
        priority: template.priority || "medium",
      };

      return await this.sendNotification(notificationData);
    } catch (error) {
      console.error("❌ Error sending automated notification:", error);
      return { success: false, error: error.message };
    }
  }

  // Get notification templates
  getNotificationTemplates() {
    return {
      order_placed: {
        type: "email",
        subject: "Order Confirmation - #{orderNumber}",
        message:
          "Hello #{customerName}, your order #{orderNumber} has been placed successfully!",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Order Confirmed! 🎉</h2>
            <p>Hello #{customerName},</p>
            <p>Thank you for your order! Your order <strong>#{orderNumber}</strong> has been placed successfully.</p>
            <p><strong>Order Total:</strong> ₹#{orderAmount}</p>
            <p>We'll notify you when your order is ready for delivery.</p>
          </div>
        `,
        priority: "high",
      },

      payment_failed: {
        type: "email",
        subject: "Payment Failed - Order #{orderNumber}",
        message:
          "Hello #{customerName}, payment for order #{orderNumber} failed. Please try again.",
        priority: "high",
      },

      order_shipped: {
        type: "email",
        subject: "Order Shipped - #{orderNumber}",
        message:
          "Hello #{customerName}, your order #{orderNumber} has been shipped!",
        priority: "medium",
      },

      low_stock_alert: {
        type: "email",
        subject: "Low Stock Alert - #{productName}",
        message:
          "Product #{productName} is running low on stock. Current stock: #{currentStock}",
        priority: "medium",
      },

      welcome_user: {
        type: "email",
        subject: "Welcome to Grocery App!",
        message: "Hello #{customerName}, welcome to our platform!",
        priority: "low",
      },
    };
  }

  // Process template with data
  processTemplate(template, data) {
    let processed = template;

    Object.keys(data).forEach((key) => {
      const placeholder = `#{${key}}`;
      processed = processed.replace(new RegExp(placeholder, "g"), data[key]);
    });

    return processed;
  }

  // Get recipients for specific trigger
  async getRecipientsForTrigger(trigger, entityId) {
    switch (trigger) {
      case "order_placed":
      case "payment_failed":
      case "order_shipped":
        const order = await require("../models/Order")
          .findById(entityId)
          .populate("userId");
        return {
          users: [order.userId._id],
        };

      case "low_stock_alert":
        // Send to admin users
        const adminUsers = await User.find({ role: "admin" }).select("_id");
        return {
          users: adminUsers.map((user) => user._id),
        };

      case "welcome_user":
        return {
          users: [entityId],
        };

      default:
        return { users: [] };
    }
  }

  // Process pending notifications
  async processPendingNotifications() {
    try {
      console.log("🔄 Processing pending notifications...");

      const pendingNotifications =
        await Notification.findPendingNotifications();

      for (const notification of pendingNotifications) {
        try {
          notification.delivery.status = "processing";
          notification.delivery.attempts += 1;
          await notification.save();

          const recipients = await this.resolveRecipients(
            notification.recipients
          );
          let result;

          switch (notification.type) {
            case "email":
              result = await this.sendEmailNotification(
                notification,
                recipients
              );
              break;
            case "sms":
              result = await this.sendSMSNotification(notification, recipients);
              break;
            case "push":
              result = await this.sendPushNotification(
                notification,
                recipients
              );
              break;
            case "in_app":
              result = await this.sendInAppNotification(
                notification,
                recipients
              );
              break;
          }

          if (result.success) {
            notification.markAsDelivered(result.deliveryDetails);
          } else {
            notification.markAsFailed(result.error);
          }

          await notification.save();
        } catch (error) {
          console.error(
            `❌ Error processing notification ${notification._id}:`,
            error
          );

          notification.delivery.attempts += 1;
          if (notification.delivery.attempts >= 3) {
            notification.markAsFailed(`Max attempts reached: ${error.message}`);
          }
          await notification.save();
        }
      }

      console.log(
        `✅ Processed ${pendingNotifications.length} pending notifications`
      );
    } catch (error) {
      console.error("❌ Error processing pending notifications:", error);
    }
  }

  // Get notification analytics
  async getNotificationAnalytics(startDate, endDate) {
    try {
      return await Notification.getAnalytics(startDate, endDate);
    } catch (error) {
      console.error("❌ Error getting notification analytics:", error);
      return [];
    }
  }
}

module.exports = new NotificationService();
