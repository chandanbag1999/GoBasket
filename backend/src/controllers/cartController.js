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
    logger.info('Add to cart request started', {
      userId: req.user?._id,
      body: req.body,
      ip: req.ip
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed', { errors: errors.array() });
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

    logger.info('Fetching product details', { productId });

    // Get product details
    const product = await Product.findById(productId)
      .populate('restaurant', 'name restaurantProfile.restaurantName');

    if (!product) {
      logger.warn('Product not found', { productId });
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    logger.info('Product found', {
      productId,
      name: product.name,
      status: product.status,
      isAvailable: product.isAvailable,
      hasVariants: !!product.variants,
      variantsLength: product.variants?.length || 0,
      hasCustomizations: !!product.customizations,
      customizationsLength: product.customizations?.length || 0
    });

    if (!product.isAvailable || product.status !== 'active') {
      logger.warn('Product not available', {
        productId,
        isAvailable: product.isAvailable,
        status: product.status
      });
      return res.status(400).json({
        success: false,
        error: 'Product is not available for ordering'
      });
    }

    // Validate selected variant
    let variant = null;
    if (selectedVariant && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      logger.info('Validating selected variant', { selectedVariant, availableVariants: product.variants.length });

      variant = product.variants.find(v => v.name === selectedVariant.name);
      if (!variant) {
        logger.warn('Selected variant not found', {
          selectedVariant: selectedVariant.name,
          availableVariants: product.variants.map(v => v.name)
        });
        return res.status(400).json({
          success: false,
          error: 'Selected variant not found'
        });
      }

      // Check variant availability
      if (!variant.isAvailable) {
        logger.warn('Selected variant not available', { variant: variant.name });
        return res.status(400).json({
          success: false,
          error: 'Selected variant is not available'
        });
      }
    } else if (selectedVariant) {
      logger.warn('Product has no variants but variant was selected', {
        selectedVariant,
        productVariants: product.variants
      });
      return res.status(400).json({
        success: false,
        error: 'This product does not have variants'
      });
    }

    // Validate customizations if provided
    if (customizations && customizations.length > 0) {
      // Check if product has customizations
      if (!product.customizations || !Array.isArray(product.customizations)) {
        return res.status(400).json({
          success: false,
          error: 'This product does not support customizations'
        });
      }

      for (const customization of customizations) {
        const productCustomization = product.customizations.find(
          pc => pc.name === customization.name
        );

        if (!productCustomization) {
          return res.status(400).json({
            success: false,
            error: `Customization '${customization.name}' is not available for this product`
          });
        }

        // Validate selected options
        if (customization.selectedOptions && customization.selectedOptions.length > 0) {
          for (const selectedOption of customization.selectedOptions) {
            const validOption = productCustomization.options.find(
              opt => opt.name === selectedOption.name && opt.isAvailable
            );

            if (!validOption) {
              return res.status(400).json({
                success: false,
                error: `Option '${selectedOption.name}' is not available for customization '${customization.name}'`
              });
            }
          }
        }

        // Check if required customization is provided
        if (productCustomization.isRequired &&
            (!customization.selectedOptions || customization.selectedOptions.length === 0)) {
          return res.status(400).json({
            success: false,
            error: `Customization '${customization.name}' is required`
          });
        }
      }
    }

    // Check for required customizations that weren't provided
    if (product.customizations && Array.isArray(product.customizations)) {
      const requiredCustomizations = product.customizations.filter(c => c.isRequired);
      for (const requiredCustomization of requiredCustomizations) {
        const providedCustomization = customizations?.find(c => c.name === requiredCustomization.name);
        if (!providedCustomization || !providedCustomization.selectedOptions?.length) {
          return res.status(400).json({
            success: false,
            error: `Required customization '${requiredCustomization.name}' is missing`
          });
        }
      }
    }

    logger.info('Finding or creating cart', {
      userId: req.user._id,
      restaurantId: product.restaurant._id
    });

    // Find or create cart for this restaurant
    let cart = await Cart.findActiveCart(req.user._id, product.restaurant._id);

    if (!cart) {
      logger.info('Creating new cart', {
        userId: req.user._id,
        restaurantId: product.restaurant._id
      });
      cart = new Cart({
        user: req.user._id,
        restaurant: product.restaurant._id,
        items: []
      });
    } else {
      logger.info('Found existing cart', {
        cartId: cart._id,
        itemsCount: cart.items?.length || 0
      });
    }

    // Check if user is trying to add items from different restaurant
    if (cart.restaurant.toString() !== product.restaurant._id.toString()) {
      logger.warn('Restaurant mismatch', {
        cartRestaurant: cart.restaurant,
        productRestaurant: product.restaurant._id
      });
      return res.status(400).json({
        success: false,
        error: 'Cannot add items from different restaurants to the same cart. Please checkout current cart or clear it.',
        conflictRestaurant: {
          current: cart.restaurant,
          new: product.restaurant._id
        }
      });
    }

    // Ensure cart.items is an array
    if (!cart.items || !Array.isArray(cart.items)) {
      logger.warn('Cart items is not an array, initializing', {
        cartId: cart._id,
        itemsType: typeof cart.items
      });
      cart.items = [];
    }

    logger.info('Checking for existing item in cart', {
      cartItemsCount: cart.items.length,
      productId,
      selectedVariant,
      customizations
    });

    // Check if adding this quantity would exceed the maximum allowed per item
    const existingItem = cart.items.find(item =>
      item.product.toString() === productId.toString() &&
      JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant) &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
    );

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;

    logger.info('Quantity validation', {
      currentQuantity,
      requestedQuantity: quantity,
      newTotalQuantity
    });

    if (newTotalQuantity > 10) {
      logger.warn('Quantity limit exceeded', {
        currentQuantity,
        requestedQuantity: quantity,
        newTotalQuantity
      });
      return res.status(400).json({
        success: false,
        error: `Cannot add ${quantity} items. Maximum 10 items allowed per product variant. Current quantity: ${currentQuantity}`
      });
    }

    // Prepare item data
    logger.info('Preparing item data', { productId, variant: variant?.name });

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

    logger.info('Item data prepared', { itemData });

    // Add item to cart
    logger.info('Adding item to cart', { cartId: cart._id });
    await cart.addItem(itemData);
    logger.info('Item added to cart successfully');

    // Populate cart for response
    logger.info('Populating cart for response');
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    logger.info('Cart populated successfully');

    logger.info('Item added to cart successfully', {
      userId: req.user._id,
      cartId: cart._id,
      productId: productId,
      quantity: quantity,
      finalQuantity: newTotalQuantity,
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
    logger.error('Add to cart error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      productId: req.body?.productId,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Server error adding item to cart',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    logger.info('Update cart item request started', {
      userId: req.user?._id,
      itemId: req.params.itemId,
      updates: req.body,
      ip: req.ip
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for update cart item', { errors: errors.array() });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { itemId } = req.params;
    const updates = req.body;

    logger.info('Looking for user active cart', { userId: req.user._id });

    // Find user's active cart
    const cart = await Cart.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!cart) {
      logger.warn('No active cart found for user', { userId: req.user._id });
      return res.status(404).json({
        success: false,
        error: 'No active cart found'
      });
    }

    logger.info('Cart found', {
      cartId: cart._id,
      itemsCount: cart.items?.length || 0,
      itemIds: cart.items?.map(item => item._id.toString()) || []
    });

    logger.info('Searching for item in cart', {
      requestedItemId: itemId,
      availableItemIds: cart.items?.map(item => ({
        itemId: item._id.toString(),
        productId: item.product.toString()
      })) || []
    });

    // Check if item exists in cart
    const item = cart.items.id(itemId);
    if (!item) {
      logger.warn('Item not found in cart', {
        requestedItemId: itemId,
        cartId: cart._id,
        availableItems: cart.items?.map(item => ({
          itemId: item._id.toString(),
          productId: item.product.toString(),
          productName: item.productSnapshot?.name
        })) || []
      });
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart',
        debug: {
          requestedItemId: itemId,
          availableItemIds: cart.items?.map(item => item._id.toString()) || [],
          availableItems: cart.items?.map(item => ({
            itemId: item._id.toString(),
            productId: item.product.toString(),
            productName: item.productSnapshot?.name
          })) || []
        }
      });
    }

    logger.info('Item found in cart', {
      itemId: item._id.toString(),
      currentQuantity: item.quantity,
      productName: item.productSnapshot?.name
    });
    
    // Update item
    logger.info('Updating cart item', { itemId, updates });
    await cart.updateItem(itemId, updates);
    logger.info('Cart item updated in database');

    // Populate cart for response
    logger.info('Populating cart for response');
    await cart.populate([
      { path: 'restaurant', select: 'name restaurantProfile.restaurantName' },
      { path: 'items.product', select: 'name images' }
    ]);
    logger.info('Cart populated successfully');

    logger.info('Cart item updated successfully', {
      userId: req.user._id,
      cartId: cart._id,
      itemId: itemId,
      updates: Object.keys(updates),
      newQuantity: cart.items.id(itemId)?.quantity,
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
    logger.error('Update cart item error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      itemId: req.params?.itemId,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating cart item',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack
        }
      })
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
    logger.info('Set delivery address request started', {
      userId: req.user?._id,
      body: req.body,
      ip: req.ip
    });

    const { addressId } = req.body;

    if (!addressId) {
      logger.warn('Address ID missing in request');
      return res.status(400).json({
        success: false,
        error: 'Address ID is required'
      });
    }

    logger.info('Fetching user with addresses', { userId: req.user._id });

    // Get user with addresses
    const user = await User.findById(req.user._id);

    if (!user) {
      logger.warn('User not found', { userId: req.user._id });
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('User found', {
      userId: user._id,
      addressesCount: user.addresses?.length || 0,
      availableAddressIds: user.addresses?.map(addr => addr._id.toString()) || []
    });

    const address = user.addresses.id(addressId);

    if (!address) {
      logger.warn('Address not found for user', {
        requestedAddressId: addressId,
        availableAddresses: user.addresses?.map(addr => ({
          id: addr._id.toString(),
          title: addr.title,
          city: addr.city
        })) || []
      });
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        debug: {
          requestedAddressId: addressId,
          availableAddressIds: user.addresses?.map(addr => addr._id.toString()) || [],
          totalAddresses: user.addresses?.length || 0
        }
      });
    }

    logger.info('Address found', {
      addressId: address._id.toString(),
      title: address.title,
      city: address.city
    });
    
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


