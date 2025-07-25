const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { rateLimits } = require('../middleware/security');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// Public endpoint (no auth required)
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: 'This is a public endpoint - no authentication required',
    timestamp: new Date().toISOString()
  });
});

// Rate limited endpoint
router.get('/rate-limited', rateLimits.search, (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint has rate limiting (30 requests per minute)',
    remaining: res.get('X-RateLimit-Remaining')
  });
});

// Protected endpoint (auth required)
router.get('/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected endpoint - authentication required',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin only endpoint
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint is only accessible by admins',
    user: req.user.name
  });
});

// Multi-role endpoint
router.get('/restaurant-admin', 
  protect, 
  authorize('admin', 'sub-admin', 'restaurant-owner'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Accessible by admin, sub-admin, or restaurant-owner',
      userRole: req.user.role
    });
  }
);

// Validation test endpoint
router.post('/validate-data', 
  validationRules.register,
  (req, res) => {
    res.json({
      success: true,
      message: 'Data validation passed!',
      receivedData: req.body
    });
  }
);

module.exports = router;
