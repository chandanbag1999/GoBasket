const express = require('express');
const CartController = require('../controllers/cartController');

// Middleware
const { protect } = require('../middleware/auth');
const { validationRules } = require('../middleware/validation');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get('/', CartController.getCart);

// Add item to cart
router.post('/items', 
  validationRules.addToCart,
  CartController.addToCart
);

// Update cart item
router.put('/items/:itemId',
  validationRules.updateCartItem,
  CartController.updateCartItem
);

// Remove item from cart
router.delete('/items/:itemId', CartController.removeFromCart);

// Clear entire cart
router.delete('/', CartController.clearCart);

// Set delivery address
router.put('/delivery-address',
  validationRules.setDeliveryAddress,
  CartController.setDeliveryAddress
);

module.exports = router;
