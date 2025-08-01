const express = require('express');
const analyticsController = require('../controllers/analyticsController');

// Middleware
const { protect, authorize } = require('../middleware/auth');
const { cacheStrategies } = require('../middleware/cache');
const { rateLimitStrategies } = require('../middleware/advancedRateLimit');

const router = express.Router();

// All analytics routes require admin access
router.use(protect);
router.use(authorize('admin', 'sub-admin'));
router.use(rateLimitStrategies.admin);

// Dashboard overview stats
router.get('/dashboard', 
  cacheStrategies.dashboardStats,
  analyticsController.getDashboardStats
);

// Order analytics with filtering
router.get('/orders', 
  analyticsController.getOrderAnalytics
);

// Restaurant performance analytics
router.get('/restaurants', 
  analyticsController.getRestaurantAnalytics
);

// User analytics
router.get('/users',
  analyticsController.getUserAnalytics
);

// Performance analytics (for frontend metrics)
router.post('/performance', (req, res) => {
  // Log performance metrics (could be stored in database)
  console.log('[Analytics] Performance metrics received:', req.body);

  res.status(200).json({
    success: true,
    message: 'Performance metrics logged'
  });
});

module.exports = router;
