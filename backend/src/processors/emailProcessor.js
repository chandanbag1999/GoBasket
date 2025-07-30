const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

const emailProcessor = async (job) => {
  const { type, data } = job.data;
  
  try {
    let result;
    
    switch (type) {
      case 'order_confirmation':
        result = await sendOrderConfirmationEmail(data);
        break;
        
      case 'payment_success':
        result = await sendPaymentSuccessEmail(data);
        break;
        
      case 'order_status_update':
        result = await sendOrderStatusUpdateEmail(data);
        break;
        
      case 'delivery_assigned':
        result = await sendDeliveryAssignedEmail(data);
        break;
        
      case 'order_delivered':
        result = await sendOrderDeliveredEmail(data);
        break;
        
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
    
    return {
      success: true,
      emailType: type,
      recipient: data.email,
      result
    };
    
  } catch (error) {
    logger.error('Email processor error:', {
      jobId: job.id,
      emailType: type,
      error: error.message,
      data
    });
    throw error;
  }
};

// Email template functions
const sendOrderConfirmationEmail = async (data) => {
  const { user, order } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Quick Commerce</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-weight: bold; font-size: 18px; color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p>Your order has been confirmed and is being prepared by <strong>${order.restaurant.name}</strong>.</p>
          
          <div class="order-details">
            <h3>Order Details:</h3>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.productSnapshot.name} x ${item.quantity}</span>
                <span>₹${item.totalPrice}</span>
              </div>
            `).join('')}
            
            <div class="item total">
              <span>Total Amount</span>
              <span>₹${order.pricing.total}</span>
            </div>
          </div>
          
          <p><strong>Estimated Delivery Time:</strong> ${new Date(order.estimatedDeliveryTime).toLocaleString('en-IN')}</p>
          <p><strong>Delivery Address:</strong><br>
          ${order.deliveryAddress.addressLine1}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}</p>
          
          <p>You can track your order in real-time using our app or website.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await emailService.sendEmail({
    email: user.email,
    subject: `🎉 Order Confirmed #${order.orderNumber} - Quick Commerce`,
    html
  });
};

const sendPaymentSuccessEmail = async (data) => {
  const { user, order, payment } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Successful - Quick Commerce</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Successful!</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p class="success">Your payment of ₹${order.pricing.total} has been processed successfully!</p>
          
          <div class="payment-details">
            <h3>Payment Details:</h3>
            <p><strong>Payment Method:</strong> ${payment.method.toUpperCase()}</p>
            <p><strong>Transaction ID:</strong> ${payment.razorpayPaymentId}</p>
            <p><strong>Amount Paid:</strong> ₹${order.pricing.total}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.paidAt).toLocaleString('en-IN')}</p>
          </div>
          
          <p>Your order is now confirmed and being prepared. You'll receive updates as your order progresses.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await emailService.sendEmail({
    email: user.email,
    subject: `💰 Payment Successful #${order.orderNumber} - Quick Commerce`,
    html
  });
};

const sendOrderStatusUpdateEmail = async (data) => {
  const { user, order, newStatus } = data;
  
  const statusMessages = {
    'confirmed': 'Your order has been confirmed by the restaurant! 🎉',
    'preparing': 'Your delicious food is being prepared! 👨‍🍳',
    'ready': 'Your order is ready for pickup! 📦',
    'picked_up': 'Your order has been picked up by delivery personnel! 🏃‍♂️',
    'out_for_delivery': 'Your order is on the way to you! 🚀',
    'delivered': 'Your order has been delivered! Enjoy your meal! 🍽️'
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update - Quick Commerce</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-update { background: white; padding: 20px; border-radius: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 Order Update</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <div class="status-update">
            <h3>${statusMessages[newStatus] || 'Your order status has been updated'}</h3>
            <p><strong>Current Status:</strong> ${newStatus.replace('_', ' ').toUpperCase()}</p>
          </div>
          <p>Track your order in real-time on our app for live updates!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await emailService.sendEmail({
    email: user.email,
    subject: `📱 Order Update #${order.orderNumber} - Quick Commerce`,
    html
  });
};

const sendDeliveryAssignedEmail = async (data) => {
  const { user, order, deliveryPerson } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Delivery Assigned - Quick Commerce</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #20c997 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .delivery-info { background: white; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏃‍♂️ Delivery Partner Assigned!</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p>Great news! A delivery partner has been assigned to your order.</p>
          
          <div class="delivery-info">
            <h3>Delivery Partner Details:</h3>
            <p><strong>Name:</strong> ${deliveryPerson.name}</p>
            <p><strong>Phone:</strong> ${deliveryPerson.phone}</p>
            <p><strong>Vehicle:</strong> ${deliveryPerson.deliveryProfile?.vehicleType || 'Two-wheeler'}</p>
          </div>
          
          <p>You'll receive updates as your order progresses to delivery!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await emailService.sendEmail({
    email: user.email,
    subject: `🏃‍♂️ Delivery Partner Assigned #${order.orderNumber} - Quick Commerce`,
    html
  });
};

const sendOrderDeliveredEmail = async (data) => {
  const { user, order } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Delivered - Quick Commerce</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #ffc107 100%); color: white; text-align: center; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .rating-request { background: white; padding: 20px; border-radius: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍽️ Order Delivered!</h1>
          <p>Order #${order.orderNumber}</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p>Your order has been delivered successfully! We hope you enjoy your meal.</p>
          
          <div class="rating-request">
            <h3>⭐ Rate Your Experience</h3>
            <p>Help us improve by rating your order experience!</p>
            <p>Rate the food quality, delivery speed, and overall service.</p>
          </div>
          
          <p>Thank you for choosing Quick Commerce! Order again soon.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await emailService.sendEmail({
    email: user.email,
    subject: `🍽️ Order Delivered #${order.orderNumber} - Quick Commerce`,
    html
  });
};

module.exports = emailProcessor;
