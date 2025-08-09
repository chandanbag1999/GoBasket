const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");

class ProductController {
  // Get all products with filters and pagination
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        subcategory,
        brand,
        minPrice,
        maxPrice,
        inStock,
        featured,
        onSale,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      let query = { isActive: true };

      // Apply filters
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (brand) query.brand = new RegExp(brand, "i");
      if (minPrice !== undefined) query.price = { $gte: parseFloat(minPrice) };
      if (maxPrice !== undefined)
        query.price = { ...query.price, $lte: parseFloat(maxPrice) };
      if (inStock === "true") query.stock = { $gt: 0 };
      if (featured === "true") query.isFeatured = true;
      if (onSale === "true") query.isOnSale = true;

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { "metadata.tags": { $regex: search, $options: "i" } },
        ];
      }

      const [products, totalProducts] = await Promise.all([
        Product.find(query)
          .populate("category", "name slug")
          .populate("subcategory", "name slug")
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip),
        Product.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalProducts / parseInt(limit));
      const hasMore = parseInt(page) < totalPages;

      res.status(200).json({
        status: "success",
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasMore,
            limit: parseInt(limit),
          },
          filters: {
            category,
            subcategory,
            brand,
            priceRange: { min: minPrice, max: maxPrice },
            inStock,
            featured,
            onSale,
            search,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get products error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch products",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get single product by ID or slug
  async getProduct(req, res) {
    try {
      const { identifier } = req.params;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

      let product;
      if (isObjectId) {
        product = await Product.findById(identifier);
      } else {
        product = await Product.findBySlug(identifier);
      }

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        });
      }

      // Increment view count
      await Product.findByIdAndUpdate(product._id, {
        $inc: { "salesMetrics.views": 1 },
      });

      // Get related products
      const relatedProducts = await Product.findActiveProducts({
        category: product.category,
        limit: 8,
      })
        .where("_id")
        .ne(product._id);

      // Get recent reviews
      const reviews = await Review.findByProduct(product._id, { limit: 5 });

      res.status(200).json({
        status: "success",
        data: {
          product,
          relatedProducts,
          reviews,
        },
      });
    } catch (error) {
      console.error("❌ Get product error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch product details",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Search products with advanced filtering
  async searchProducts(req, res) {
    try {
      const {
        q: searchTerm,
        page = 1,
        limit = 20,
        category,
        minPrice,
        maxPrice,
        inStock,
        sortBy = "relevance",
      } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          status: "error",
          message: "Search term must be at least 2 characters long",
          code: "INVALID_SEARCH_TERM",
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const searchOptions = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStock === "true",
        limit: parseInt(limit),
        skip,
      };

      const [products, totalProducts] = await Promise.all([
        Product.searchProducts(searchTerm.trim(), searchOptions),
        Product.countDocuments({
          isActive: true,
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { brand: { $regex: searchTerm, $options: "i" } },
            { "metadata.tags": { $regex: searchTerm, $options: "i" } },
          ],
          ...(category && { category }),
          ...(searchOptions.minPrice && {
            price: { $gte: searchOptions.minPrice },
          }),
          ...(searchOptions.maxPrice && {
            price: { $lte: searchOptions.maxPrice },
          }),
          ...(searchOptions.inStock && { stock: { $gt: 0 } }),
        }),
      ]);

      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      // Generate search suggestions if no results
      let suggestions = [];
      if (products.length === 0) {
        suggestions = await this.generateSearchSuggestions(searchTerm);
      }

      res.status(200).json({
        status: "success",
        data: {
          products,
          searchTerm,
          suggestions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Search products error:", error);

      res.status(500).json({
        status: "error",
        message: "Search failed",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get featured products
  async getFeaturedProducts(req, res) {
    try {
      const { limit = 12 } = req.query;

      const products = await Product.findActiveProducts({
        featured: true,
        inStock: true,
        limit: parseInt(limit),
      });

      res.status(200).json({
        status: "success",
        data: { products },
      });
    } catch (error) {
      console.error("❌ Get featured products error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch featured products",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { categorySlug } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const category = await Category.findBySlug(categorySlug);
      if (!category) {
        return res.status(404).json({
          status: "error",
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND",
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [products, totalProducts] = await Promise.all([
        Product.find({ category: category._id, isActive: true })
          .populate("category", "name slug")
          .populate("subcategory", "name slug")
          .sort(sort)
          .limit(parseInt(limit))
          .skip(skip),
        Product.countDocuments({ category: category._id, isActive: true }),
      ]);

      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      res.status(200).json({
        status: "success",
        data: {
          category,
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("❌ Get products by category error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch products by category",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Generate search suggestions
  async generateSearchSuggestions(searchTerm) {
    try {
      const suggestions = await Product.aggregate([
        {
          $match: {
            isActive: true,
            $or: [
              { name: { $regex: searchTerm.slice(0, -1), $options: "i" } },
              { brand: { $regex: searchTerm.slice(0, -1), $options: "i" } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            names: { $addToSet: "$name" },
            brands: { $addToSet: "$brand" },
          },
        },
        {
          $project: {
            suggestions: { $concatArrays: ["$names", "$brands"] },
          },
        },
      ]);

      return suggestions[0]?.suggestions?.slice(0, 5) || [];
    } catch (error) {
      console.error("❌ Generate suggestions error:", error);
      return [];
    }
  }
}

module.exports = new ProductController();
