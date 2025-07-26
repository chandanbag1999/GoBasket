const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Get all products with filters
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      restaurant,
      minPrice,
      maxPrice,
      isVegetarian,
      spiceLevel,
      sort = '-rating.average',
      search
    } = req.query;

    // Build query
    const query = {
      status: 'active',
      isAvailable: true
    };

    // Apply filters
    if (category) query.category = category;
    if (restaurant) query.restaurant = restaurant;
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    if (isVegetarian === 'true') query.isVegetarian = true;
    if (spiceLevel) query.spiceLevel = spiceLevel;

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('restaurant', 'name restaurantProfile.restaurantName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: {
        products
      }
    });

  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching products'
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: { $in: ['active', 'inactive'] }
    })
      .populate('category', 'name slug description')
      .populate('subcategory', 'name slug')
      .populate('restaurant', 'name restaurantProfile');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching product'
    });
  }
};

// Create new product (Restaurant Owner)
exports.createProduct = async (req, res) => {
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
      name,
      description,
      shortDescription,
      category,
      subcategory,
      basePrice,
      variants,
      customizations,
      isVegetarian,
      isVegan,
      containsEgg,
      spiceLevel,
      nutrition,
      allergens,
      ingredients,
      preparationTime,
      tags,
      availabilitySchedule
    } = req.body;

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Verify subcategory exists and belongs to category
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc || subcategoryDoc.parentCategory?.toString() !== category) {
        return res.status(400).json({
          success: false,
          error: 'Invalid subcategory for selected category'
        });
      }
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim(),
      category,
      subcategory: subcategory || null,
      restaurant: req.user._id,
      basePrice,
      variants: variants || [],
      customizations: customizations || [],
      isVegetarian: isVegetarian || false,
      isVegan: isVegan || false,
      containsEgg: containsEgg || false,
      spiceLevel: spiceLevel || 'mild',
      nutrition: nutrition || {},
      allergens: allergens || [],
      ingredients: ingredients || [],
      preparationTime: preparationTime || 15,
      tags: tags || [],
      availabilitySchedule: availabilitySchedule || {},
      status: 'draft' // Products start as draft
    });

    // Populate for response
    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    logger.info('Product created successfully', {
      productId: product._id,
      name: product.name,
      restaurant: req.user._id,
      category: category,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Create product error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format. Please provide a valid MongoDB ObjectId.',
        details: error.message
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Product validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error creating product',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

// Update product (Restaurant Owner - own products only)
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership (restaurant owners can only edit their own products)
    if (req.user.role === 'restaurant-owner' && product.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this product'
      });
    }

    const updateData = req.body;

    // Verify category if being updated
    if (updateData.category && updateData.category !== product.category.toString()) {
      const categoryDoc = await Category.findById(updateData.category);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== '_id' && key !== 'restaurant') {
        product[key] = updateData[key];
      }
    });

    await product.save();

    // Populate for response
    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    logger.info('Product updated successfully', {
      productId: product._id,
      name: product.name,
      updatedBy: req.user._id,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating product'
    });
  }
};
 
// Delete product (Restaurant Owner - own products only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role === 'restaurant-owner' && product.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this product'
      });
    }

    // Delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(image => {
        return cloudinary.uploader.destroy(image.public_id).catch(error => {
          logger.warn('Failed to delete product image from Cloudinary:', error);
        });
      });
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(req.params.id);

    logger.info('Product deleted successfully', {
      productId: product._id,
      name: product.name,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting product'
    });
  }
};

// Upload product images (Restaurant Owner)
exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files uploaded'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role === 'restaurant-owner' && product.restaurant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload images for this product'
      });
    }

    // Check total image limit (max 5 images per product)
    if (product.images.length + req.files.length > 5) {
      return res.status(400).json({
        success: false,
        error: `Maximum 5 images allowed per product. Current: ${product.images.length}, Uploading: ${req.files.length}`
      });
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              alt_text: `${product.name} - Image ${product.images.length + index + 1}`,
              isDefault: product.images.length === 0 && index === 0 // First image of empty product is default
            });
          }
        );
        stream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Add images to product
    product.images.push(...uploadedImages);
    await product.save();

    logger.info('Product images uploaded successfully', {
      productId: product._id,
      imagesCount: uploadedImages.length,
      uploadedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: uploadedImages,
        totalImages: product.images.length
      }
    });

  } catch (error) {
    logger.error('Upload product images error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error uploading images'
    });
  }
};

// Get products by restaurant
exports.getProductsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, status = 'active', page = 1, limit = 20 } = req.query;

    // Build query
    const query = { restaurant: restaurantId };
    if (category) query.category = category;
    if (status === 'all') {
      query.status = { $in: ['active', 'inactive', 'draft'] };
    } else {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: {
        products
      }
    });

  } catch (error) {
    logger.error('Get products by restaurant error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching restaurant products'
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const products = await Product.searchProducts(query.trim(), filters);

    res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products,
        query: query.trim()
      }
    });

  } catch (error) {
    logger.error('Search products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching products'
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.getFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products
      }
    });

  } catch (error) {
    logger.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching featured products'
    });
  }
};

// Get trending products
exports.getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.getTrending(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      data: {
        products
      }
    });

  } catch (error) {
    logger.error('Get trending products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching trending products'
    });
  }
};

