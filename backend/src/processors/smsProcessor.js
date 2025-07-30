const smsService = require('../utils/smsService');
const logger = require('../utils/logger');

const smsProcessor = async (job) => {
  const { type, data } = job.data;
  
  try {
    let result;
    
    switch (type) {
      case 'order_confirmation':
        result = await sendOrderConfirmationSMS(data);
        break;
        
      case 'payment_success':
        result = await sendPaymentSuccessSMS(data);
        break;
        
      case 'order_ready':
        result = await sendOrderReadySMS(data);
        break;
        
      case 'out_for_delivery':
        result = await sendOutForDeliverySMS(data);
        break;
        
      case 'order_delivered':
        result = await sendOrderDeliveredSMS(data);
        break;
        
      default:
        throw new Error(`Unknown SMS type: ${type}`);
    }
    
    return {
      success: true,
      smsType: type,
      recipient: data.phone,
      result
    };
    
  } catch (error) {
    logger.error('SMS processor error:', {
      jobId: job.id,
      smsType: type,
      error: error.message,
      data
    });
    throw error;
  }
};

// SMS template functions
const sendOrderConfirmationSMS = async (data) => {
  const { user, order } = data;
  
  const message = `Hi ${user.name}, your order #${order.orderNumber} has been confirmed! 🎉 Total: ₹${order.pricing.total}. Estimated delivery: ${new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Track: quickcommerce.com/track/${order._id}`;
  
  return await smsService.sendOTP(user.phone, message, user.name);
};

const sendPaymentSuccessSMS = async (data) => {
  const { user, order } = data;
  
  const message = `Payment successful! ₹${order.pricing.total} paid for order #${order.orderNumber}. Your order is confirmed and being prepared. - Quick Commerce`;
  
  return await smsService.sendOTP(user.phone, message, user.name);
};

const sendOrderReadySMS = async (data) => {
  const { user, order } = data;
  
  const message = `Great news! Your order #${order.orderNumber} is ready for pickup. A delivery partner will be assigned soon. - Quick Commerce`;
  
  return await smsService.sendOTP(user.phone, message, user.name);
};

const sendOutForDeliverySMS = async (data) => {
  const { user, order, deliveryPerson } = data;
  
  const message = `Your order #${order.orderNumber} is on the way! 🚀 Delivery partner: ${deliveryPerson.name} (${deliveryPerson.phone}). ETA: 15-20 mins. - Quick Commerce`;
  
  return await smsService.sendOTP(user.phone, message, user.name);
};

const sendOrderDeliveredSMS = async (data) => {
  const { user, order } = data;
  
  const message = `Order #${order.orderNumber} delivered! 🍽️ Enjoy your meal! Please rate your experience. Thank you for choosing Quick Commerce!`;
  
  return await smsService.sendOTP(user.phone, message, user.name);
};

module.exports = smsProcessor;
