const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Get user's active cart
exports.getCart = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    let cart;
    if (restaurantId) {
      // Get cart for specific restaurant
      cart = await Cart.findActiveCart(req.user._id, restaurantId);
    } else {
      // Get any active cart
      cart = await Cart.findOne({
        user: req.user._id,
        status: 'active'
      })
        .populate('restaurant', 'name restaurantProfile.restaurantName')
        .populate('items.product', 'name images isAvailable status');
    }
    
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: null,
          message: 'No active cart found'
        }
      });
    }
    
    // Check if any items are no longer available
    const unavailableItems = cart.items.filter(item => 
      !item.product.isAvailable || item.product.status !== 'active'
    );
    
    if (unavailableItems.length > 0) {
      logger.warn('Cart contains unavailable items', {
        userId: req.user._id,
        cartId: cart._id,
        unavailableItems: unavailableItems.map(item => item.product._id)
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        warnings: unavailableItems.length > 0 ? {
          message: `${unavailableItems.length} item(s) in your cart are no longer available`,
          unavailableItems
        } : null
      }
    });
    
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching cart'
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const {
      productId,
      quantity,
      selectedVariant,
      customizations,
      specialInstructions
    } = req.body;
    
    // Get product details
    const product = await Product.findById(productId)
      .populate('restaurant', 'name restaurantProfile.restaurantName');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    if (!product.isAvailable || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Product is not available for ordering'
      });
    }
    
    // Validate selected variant
    let variant = null;
    if (selectedVariant && product.variants.length > 0) {
      variant = product.variants.find(v => v.name === selectedVariant.name);
      if (!variant) {
        return res.status(400).json({
          success: false,
          error: 'Selected variant not found'
        });
      }
    }
    
    // Find or create cart for this restaurant
    let cart = await Cart.findActiveCart(req.user._id, product.restaurant._id);
    
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        restaurant: product.restaurant._id,
        items: []
      });
    }
    
    // Check if user is trying to add items from different restaurant
    if (cart.restaurant.toString() !== product.restaurant._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot add items from different restaurants to the same cart. Please checkout current cart or clear it.',
        conflictRestaurant: {
          current: cart.restaurant,
          new: product.restaurant._id
        }
      });
    }
    
    // Prepare item data
    const itemData = {
      product: productId,
      productSnapshot: {
        name: product.name,
        basePrice: product.basePrice,
        image: product.defaultImage?.secure_url,
        isAvailable: product.isAvailable
      },
      selectedVariant: variant ? {
        name: variant.name,
        price: variant.price,
        preparationTime: variant.preparationTime
      } : null,
      customizations: customizations || [],
      quantity: quantity,
      specialInstructions: specialInstructions || ''
    };
    
    // Add item to cart
    await cart.addItem(itemData);
    
    // Populate cart for response
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    
    logger.info('Item added to cart successfully', {
      userId: req.user._id,
      cartId: cart._id,
      productId: productId,
      quantity: quantity,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart
      }
    });
    
  } catch (error) {
    logger.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error adding item to cart'
    });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { itemId } = req.params;
    const updates = req.body;
    
    // Find user's active cart
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'No active cart found'
      });
    }
    
    // Check if item exists in cart
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    // Update item
    await cart.updateItem(itemId, updates);
    
    // Populate cart for response
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    
    logger.info('Cart item updated successfully', {
      userId: req.user._id,
      cartId: cart._id,
      itemId: itemId,
      updates: Object.keys(updates),
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart
      }
    });
    
  } catch (error) {
    logger.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating cart item'
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Find user's active cart
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'No active cart found'
      });
    }
    
    // Check if item exists
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    // Remove item
    await cart.removeItem(itemId);
    
    // If cart is empty, mark as abandoned
    if (cart.items.length === 0) {
      cart.status = 'abandoned';
      await cart.save();
    }
    
    // Populate cart for response
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    
    logger.info('Item removed from cart successfully', {
      userId: req.user._id,
      cartId: cart._id,
      itemId: itemId,
      remainingItems: cart.items.length,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart: cart.items.length > 0 ? cart : null
      }
    });
    
  } catch (error) {
    logger.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error removing item from cart'
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'No active cart found'
      });
    }
    
    // Clear cart items and mark as abandoned
    await cart.clearCart();
    cart.status = 'abandoned';
    await cart.save();
    
    logger.info('Cart cleared successfully', {
      userId: req.user._id,
      cartId: cart._id,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error clearing cart'
    });
  }
};

// Apply delivery address to cart
exports.setDeliveryAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    
    if (!addressId) {
      return res.status(400).json({
        success: false,
        error: 'Address ID is required'
      });
    }
    
    // Get user with addresses
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    // Find active cart
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'No active cart found'
      });
    }
    
    // Set delivery address
    cart.deliveryAddress = addressId;
    await cart.save();
    
    // Populate for response
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    
    logger.info('Delivery address set for cart', {
      userId: req.user._id,
      cartId: cart._id,
      addressId: addressId,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Delivery address set successfully',
      data: {
        cart
      }
    });
    
  } catch (error) {
    logger.error('Set delivery address error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error setting delivery address'
    });
  }
};


