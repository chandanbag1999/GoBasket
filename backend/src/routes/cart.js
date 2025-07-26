const express = require('express');
const artController = require('../controllers/cartController');

// Middleware
const { protect } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get('/', artController.getCart);

// Add item to cart
router.post('/items', 
  validationRules.addToCart,
  artController.addToCart
);

// Update cart item
router.put('/items/:itemId',
  validationRules.updateCartItem,
  artController.updateCartItem
);

// Remove item from cart
router.delete('/items/:itemId', artController.removeFromCart);

// Clear entire cart
router.delete('/', clearCart);

// Set delivery address
router.put('/delivery-address',
  validationRules.setDeliveryAddress,
  artController.setDeliveryAddress
);

module.exports = router;
