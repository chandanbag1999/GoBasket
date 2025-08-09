const Cart = require("../models/Cart");
const Product = require("../models/Product"); // You'll need this

class CartController {
  // Get user's cart
  async getCart(req, res) {
    try {
      const userId = req.user._id;

      let cart = await Cart.findByUser(userId);

      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }

      res.status(200).json({
        status: "success",
        data: {
          cart: {
            id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            lastModified: cart.lastModified,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get cart error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch cart",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Add item to cart
  async addToCart(req, res) {
    try {
      const userId = req.user._id;
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          status: "error",
          message: "Product ID and valid quantity are required",
          code: "INVALID_INPUT",
        });
      }

      // Find product (you'll need Product model)
      // const product = await Product.findById(productId);
      // if (!product) {
      //   return res.status(404).json({
      //     status: 'error',
      //     message: 'Product not found',
      //     code: 'PRODUCT_NOT_FOUND'
      //   });
      // }

      // For now, using mock product data
      const mockProduct = {
        _id: productId,
        name: "Sample Product",
        price: 100,
        stock: 50,
      };

      if (quantity > mockProduct.stock) {
        return res.status(400).json({
          status: "error",
          message: "Insufficient stock",
          code: "INSUFFICIENT_STOCK",
          availableStock: mockProduct.stock,
        });
      }

      let cart = await Cart.findByUser(userId);
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      cart.addItem(productId, quantity, mockProduct.price);
      await cart.save();

      // Populate the cart
      await cart.populate(
        "items.productId",
        "name images price stock category unit"
      );

      console.log(`✅ Item added to cart for user: ${req.user.email}`);

      res.status(200).json({
        status: "success",
        message: "Item added to cart",
        data: {
          cart: {
            id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Add to cart error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to add item to cart",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update cart item
  async updateCartItem(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({
          status: "error",
          message: "Valid quantity is required",
          code: "INVALID_QUANTITY",
        });
      }

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({
          status: "error",
          message: "Cart not found",
          code: "CART_NOT_FOUND",
        });
      }

      cart.updateItem(productId, quantity);
      await cart.save();

      await cart.populate(
        "items.productId",
        "name images price stock category unit"
      );

      console.log(`✅ Cart item updated for user: ${req.user.email}`);

      res.status(200).json({
        status: "success",
        message: quantity > 0 ? "Cart item updated" : "Cart item removed",
        data: {
          cart: {
            id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Update cart item error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update cart item",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({
          status: "error",
          message: "Cart not found",
          code: "CART_NOT_FOUND",
        });
      }

      cart.removeItem(productId);
      await cart.save();

      await cart.populate(
        "items.productId",
        "name images price stock category unit"
      );

      console.log(`✅ Item removed from cart for user: ${req.user.email}`);

      res.status(200).json({
        status: "success",
        message: "Item removed from cart",
        data: {
          cart: {
            id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Remove from cart error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to remove item from cart",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Clear cart
  async clearCart(req, res) {
    try {
      const userId = req.user._id;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({
          status: "error",
          message: "Cart not found",
          code: "CART_NOT_FOUND",
        });
      }

      cart.clear();
      await cart.save();

      console.log(`✅ Cart cleared for user: ${req.user.email}`);

      res.status(200).json({
        status: "success",
        message: "Cart cleared successfully",
        data: {
          cart: {
            id: cart._id,
            items: [],
            totalItems: 0,
            totalAmount: 0,
          },
        },
      });
    } catch (error) {
      console.error("❌ Clear cart error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to clear cart",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new CartController();
