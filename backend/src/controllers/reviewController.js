const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

class ReviewController {
  // Create a new review
  async createReview(req, res) {
    try {
      const userId = req.user._id;
      const {
        productId,
        orderId,
        rating,
        title,
        comment,
        images = [],
      } = req.body;

      // Check if order exists and belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId,
        status: "delivered",
      });

      if (!order) {
        return res.status(400).json({
          status: "error",
          message: "Order not found or not eligible for review",
          code: "ORDER_NOT_ELIGIBLE",
        });
      }

      // Check if product was in the order
      const orderItem = order.items.find(
        (item) => item.productId.toString() === productId
      );

      if (!orderItem) {
        return res.status(400).json({
          status: "error",
          message: "Product not found in this order",
          code: "PRODUCT_NOT_IN_ORDER",
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        user: userId,
        product: productId,
      });

      if (existingReview) {
        return res.status(409).json({
          status: "error",
          message: "You have already reviewed this product",
          code: "REVIEW_EXISTS",
        });
      }

      // Create review
      const review = new Review({
        user: userId,
        product: productId,
        order: orderId,
        rating,
        title: title?.trim(),
        comment: comment.trim(),
        images,
        isVerifiedPurchase: true,
        status: "approved", // Auto-approve for now
      });

      await review.save();

      // Update product rating
      const product = await Product.findById(productId);
      product.updateRating(rating);
      await product.save();

      await review.populate("user", "firstName lastName profilePicture.url");

      console.log(
        `✅ Review created for product ${productId} by user ${userId}`
      );

      res.status(201).json({
        status: "success",
        message: "Review submitted successfully",
        data: { review },
      });
    } catch (error) {
      console.error("❌ Create review error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to create review",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get reviews for a product
  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const {
        page = 1,
        limit = 10,
        rating,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      let query = {
        product: productId,
        status: "approved",
      };

      if (rating) {
        query.rating = parseInt(rating);
      }

      const [reviews, totalReviews, reviewStats] = await Promise.all([
        Review.find(query)
          .populate("user", "firstName lastName profilePicture.url")
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip),
        Review.countDocuments(query),
        Review.getProductReviewStats(productId),
      ]);

      const totalPages = Math.ceil(totalReviews / parseInt(limit));

      res.status(200).json({
        status: "success",
        data: {
          reviews,
          stats: reviewStats[0] || {
            averageRating: 0,
            totalReviews: 0,
            five: 0,
            four: 0,
            three: 0,
            two: 0,
            one: 0,
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get product reviews error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch reviews",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get user's reviews
  async getUserReviews(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [reviews, totalReviews] = await Promise.all([
        Review.find({ user: userId })
          .populate("product", "name slug images.url price")
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip(skip),
        Review.countDocuments({ user: userId }),
      ]);

      const totalPages = Math.ceil(totalReviews / parseInt(limit));

      res.status(200).json({
        status: "success",
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get user reviews error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch user reviews",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Update review
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;
      const { rating, title, comment, images } = req.body;

      const review = await Review.findOne({
        _id: reviewId,
        user: userId,
      });

      if (!review) {
        return res.status(404).json({
          status: "error",
          message: "Review not found",
          code: "REVIEW_NOT_FOUND",
        });
      }

      const oldRating = review.rating;

      // Update review fields
      if (rating !== undefined) review.rating = rating;
      if (title !== undefined) review.title = title?.trim();
      if (comment !== undefined) review.comment = comment.trim();
      if (images !== undefined) review.images = images;

      review.status = "pending"; // Re-moderate if content changed
      await review.save();

      // Update product rating if rating changed
      if (rating !== undefined && rating !== oldRating) {
        const product = await Product.findById(review.product);
        product.updateRating(rating, oldRating);
        await product.save();
      }

      await review.populate("user", "firstName lastName profilePicture.url");

      console.log(`✅ Review ${reviewId} updated by user ${userId}`);

      res.status(200).json({
        status: "success",
        message: "Review updated successfully",
        data: { review },
      });
    } catch (error) {
      console.error("❌ Update review error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to update review",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Delete review
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;

      const review = await Review.findOne({
        _id: reviewId,
        user: userId,
      });

      if (!review) {
        return res.status(404).json({
          status: "error",
          message: "Review not found",
          code: "REVIEW_NOT_FOUND",
        });
      }

      // Update product rating
      const product = await Product.findById(review.product);
      product.updateRating(null, review.rating);
      await product.save();

      await Review.findByIdAndDelete(reviewId);

      console.log(`✅ Review ${reviewId} deleted by user ${userId}`);

      res.status(200).json({
        status: "success",
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error("❌ Delete review error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to delete review",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Mark review as helpful
  async markHelpful(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: "error",
          message: "Review not found",
          code: "REVIEW_NOT_FOUND",
        });
      }

      review.markHelpful(userId);
      await review.save();

      res.status(200).json({
        status: "success",
        message: "Review marked as helpful",
        data: {
          helpfulCount: review.helpfulVotes.count,
        },
      });
    } catch (error) {
      console.error("❌ Mark helpful error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to mark review as helpful",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }
}

module.exports = new ReviewController();
