const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

class WishlistController {
  // Get user's wishlist
  async getWishlist(req, res) {
    try {
      const userId = req.user._id;

      let wishlist = await Wishlist.findByUser(userId);

      if (!wishlist) {
        wishlist = new Wishlist({
          user: userId,
          items: [],
        });
        await wishlist.save();
      }

      // Filter out inactive products
      wishlist.items = wishlist.items.filter((item) => item.product);

      res.status(200).json({
        status: "success",
        data: {
          wishlist: {
            id: wishlist._id,
            name: wishlist.name,
            isPublic: wishlist.isPublic,
            items: wishlist.items,
            itemCount: wishlist.itemCount,
            updatedAt: wishlist.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get wishlist error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch wishlist",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Add item to wishlist
  async addToWishlist(req, res) {
    try {
      const userId = req.user._id;
      const { productId, notes } = req.body;

      // Check if product exists and is active
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found or not available",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      let wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        wishlist = new Wishlist({
          user: userId,
          items: [],
        });
      }

      // Check if item already exists
      if (wishlist.hasItem(productId)) {
        return res.status(409).json({
          status: "error",
          message: "Product already in wishlist",
          code: "PRODUCT_ALREADY_IN_WISHLIST",
        });
      }

      wishlist.addItem(productId, notes);
      await wishlist.save();

      // Update product wishlist count
      await Product.findByIdAndUpdate(productId, {
        $inc: { "salesMetrics.wishlisted": 1 },
      });

      await wishlist.populate({
        path: "items.product",
        select: "name slug price comparePrice images stock isActive",
      });

      console.log(
        `✅ Product ${productId} added to wishlist for user ${userId}`
      );

      res.status(200).json({
        status: "success",
        message: "Product added to wishlist",
        data: {
          wishlist: {
            id: wishlist._id,
            itemCount: wishlist.itemCount,
            items: wishlist.items,
          },
        },
      });
    } catch (error) {
      console.error("❌ Add to wishlist error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to add product to wishlist",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Remove item from wishlist
  async removeFromWishlist(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;

      const wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        return res.status(404).json({
          status: "error",
          message: "Wishlist not found",
          code: "WISHLIST_NOT_FOUND",
        });
      }

      if (!wishlist.hasItem(productId)) {
        return res.status(404).json({
          status: "error",
          message: "Product not found in wishlist",
          code: "PRODUCT_NOT_IN_WISHLIST",
        });
      }

      wishlist.removeItem(productId);
      await wishlist.save();

      // Update product wishlist count
      await Product.findByIdAndUpdate(productId, {
        $inc: { "salesMetrics.wishlisted": -1 },
      });

      await wishlist.populate({
        path: "items.product",
        select: "name slug price comparePrice images stock isActive",
      });

      console.log(
        `✅ Product ${productId} removed from wishlist for user ${userId}`
      );

      res.status(200).json({
        status: "success",
        message: "Product removed from wishlist",
        data: {
          wishlist: {
            id: wishlist._id,
            itemCount: wishlist.itemCount,
            items: wishlist.items,
          },
        },
      });
    } catch (error) {
      console.error("❌ Remove from wishlist error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to remove product from wishlist",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update wishlist item notes
  async updateWishlistItem(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      const { notes } = req.body;

      const wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        return res.status(404).json({
          status: "error",
          message: "Wishlist not found",
          code: "WISHLIST_NOT_FOUND",
        });
      }

      const item = wishlist.items.find(
        (item) => item.product.toString() === productId
      );

      if (!item) {
        return res.status(404).json({
          status: "error",
          message: "Product not found in wishlist",
          code: "PRODUCT_NOT_IN_WISHLIST",
        });
      }

      item.notes = notes?.trim() || "";
      await wishlist.save();

      await wishlist.populate({
        path: "items.product",
        select: "name slug price comparePrice images stock isActive",
      });

      res.status(200).json({
        status: "success",
        message: "Wishlist item updated",
        data: {
          item: wishlist.items.find(
            (item) => item.product._id.toString() === productId
          ),
        },
      });
    } catch (error) {
      console.error("❌ Update wishlist item error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update wishlist item",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Clear wishlist
  async clearWishlist(req, res) {
    try {
      const userId = req.user._id;

      const wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        return res.status(404).json({
          status: "error",
          message: "Wishlist not found",
          code: "WISHLIST_NOT_FOUND",
        });
      }

      // Update product wishlist counts
      const productIds = wishlist.items.map((item) => item.product);
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $inc: { "salesMetrics.wishlisted": -1 } }
      );

      wishlist.items = [];
      await wishlist.save();

      console.log(`✅ Wishlist cleared for user ${userId}`);

      res.status(200).json({
        status: "success",
        message: "Wishlist cleared successfully",
        data: {
          wishlist: {
            id: wishlist._id,
            itemCount: 0,
            items: [],
          },
        },
      });
    } catch (error) {
      console.error("❌ Clear wishlist error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to clear wishlist",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update wishlist settings
  async updateWishlistSettings(req, res) {
    try {
      const userId = req.user._id;
      const { name, isPublic } = req.body;

      let wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        wishlist = new Wishlist({
          user: userId,
          items: [],
        });
      }

      if (name !== undefined) wishlist.name = name.trim();
      if (isPublic !== undefined) wishlist.isPublic = isPublic;

      await wishlist.save();

      res.status(200).json({
        status: "success",
        message: "Wishlist settings updated",
        data: {
          wishlist: {
            id: wishlist._id,
            name: wishlist.name,
            isPublic: wishlist.isPublic,
          },
        },
      });
    } catch (error) {
      console.error("❌ Update wishlist settings error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update wishlist settings",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new WishlistController();
