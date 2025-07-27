const express = require('express');
const OrderController = require('../controllers/orderController');

// Middleware
const { protect, authorize } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Customer routes
router.post('/checkout',
  validationRules.checkout,
  OrderController.checkout
);

router.get('/my-orders', OrderController.getMyOrders);

// Restaurant owner routes (MOVED BEFORE parameterized routes to avoid conflicts)
router.get('/restaurant/orders',
  authorize('restaurant-owner', 'admin', 'sub-admin'),
  OrderController.getRestaurantOrders
);

// Parameterized routes (MOVED AFTER specific routes)
router.get('/:orderId', OrderController.getOrder);

router.get('/:orderId/tracking', OrderController.getOrderTracking);

router.put('/:orderId/cancel',
  validationRules.cancelOrder,
  OrderController.cancelOrder
);

router.post('/:orderId/rating',
  validationRules.addOrderRating,
  OrderController.addOrderRating
);

router.put('/:orderId/status',
  authorize('restaurant-owner', 'delivery-personnel', 'admin', 'sub-admin'),
  validationRules.updateOrderStatus,
  OrderController.updateOrderStatus
);

// Admin routes
router.put('/:orderId/assign-delivery',
  authorize('admin', 'sub-admin'),
  validationRules.assignDeliveryPersonnel,
  OrderController.assignDeliveryPersonnel
);

module.exports = router;
