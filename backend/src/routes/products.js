const express = require('express');
const ProductController = require('../controllers/productController');

// Middleware
const { protect, authorize } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');
const upload = require('../config/multer');

const router = express.Router();

// Public routes
router.get('/', ProductController.getProducts);
router.get('/search', ProductController.searchProducts);
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/trending', ProductController.getTrendingProducts);
router.get('/restaurant/:restaurantId', ProductController.getProductsByRestaurant);
router.get('/:id', ProductController.getProduct);

// Restaurant owner routes
router.post('/',
  protect,
  authorize('restaurant-owner', 'admin'),
  validationRules.createProduct,
  ProductController.createProduct
);

router.put('/:id', 
  protect, 
  authorize('restaurant-owner', 'admin'), 
  ProductController.updateProduct
);

router.delete('/:id', 
  protect, 
  authorize('restaurant-owner', 'admin'), 
  ProductController.deleteProduct
);

router.post('/:id/images', 
  protect, 
  authorize('restaurant-owner', 'admin'),
  upload.array('images', 5), // Max 5 images
  ProductController.uploadProductImages
);

module.exports = router;
