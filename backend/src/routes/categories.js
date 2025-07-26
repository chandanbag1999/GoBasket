const express = require('express');
const CategoryController = require('../controllers/categoryController');

// Middleware
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const { debugMulter } = require('../config/multer');

const router = express.Router();

// Public routes
router.get('/', CategoryController.getCategories);
router.get('/search', CategoryController.searchCategories);
router.get('/:id', CategoryController.getCategory);

// Admin only routes
router.post('/', 
  protect, 
  authorize('admin'), 
  CategoryController.createCategory
);

router.put('/:id', 
  protect, 
  authorize('admin'), 
  CategoryController.updateCategory
);

router.delete('/:id', 
  protect, 
  authorize('admin'), 
  CategoryController.deleteCategory
);

router.post('/:id/image',
  protect,
  authorize('admin'),
  debugMulter,
  upload.single('image'),
  CategoryController.uploadCategoryImage
);

module.exports = router;
