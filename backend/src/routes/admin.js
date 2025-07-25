const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');
const router = express.Router();

// Admin only
router.get('/users',
  protect,
  authorize('admin'),
  AdminController.searchUsers
);

module.exports = router;
