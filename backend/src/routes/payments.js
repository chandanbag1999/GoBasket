const express = require('express');
const PaymentController = require('../controllers/paymentController');

// Middleware
const { protect, authorize } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// Customer payment routes
router.post('/create-order',
  validationRules.createPaymentOrder,
  PaymentController.createPaymentOrder
);

router.post('/verify',
  validationRules.verifyPayment,
  PaymentController.verifyPayment
);

router.post('/failure',
  validationRules.paymentFailure,
  PaymentController.handlePaymentFailure
);

router.get('/history', PaymentController.getPaymentHistory);

// Restaurant payment analytics
router.get('/restaurant-analytics',
  authorize('restaurant-owner', 'admin'),
  PaymentController.getRestaurantPaymentAnalytics
);

module.exports = router;
