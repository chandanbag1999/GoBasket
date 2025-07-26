const Category = require('../models/Category');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Get all categories with hierarchy
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.getHierarchy();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: {
        categories
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching categories'
    });
  }
};

// Get single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug image isActive');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching category'
    });
  }
};

// Create new category(Admin only)
exports.createCategory = async (req, res) => {
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
      parentCategory,
      cuisine,
      tags,
      displayOrder,
      isFeatured,
      meta
    } = req.body;

    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      name: new RegExp(`^${name}$`, 'i') 
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent category not found'
        });
      }
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      parentCategory: parentCategory || null,
      cuisine,
      tags: tags || [],
      displayOrder: displayOrder || 0,
      isFeatured: isFeatured || false,
      meta: meta || {}
    });

    // Populate for response
    await category.populate('parentCategory', 'name slug');

    logger.info('Category created successfully', {
      categoryId: category._id,
      name: category.name,
      createdBy: req.user._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating category'
    });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const {
      name,
      description,
      parentCategory,
      cuisine,
      tags,
      displayOrder,
      isFeatured,
      isActive,
      meta
    } = req.body;

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: category._id }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          error: 'Category name already exists'
        });
      }
    }

    // Validate parent category if provided
    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent category not found'
        });
      }

      // Prevent circular reference
      if (parentCategory === category._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Category cannot be its own parent'
        });
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (cuisine) category.cuisine = cuisine;
    if (tags) category.tags = tags;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (isActive !== undefined) category.isActive = isActive;
    if (meta) category.meta = { ...category.meta, ...meta };

    await category.save();

    // Populate for response
    await category.populate('parentCategory', 'name slug');

    logger.info('Category updated successfully', {
      categoryId: category._id,
      name: category.name,
      updatedBy: req.user._id,
      updatedFields: Object.keys(req.body),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating category'
    });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category has subcategories
    if (category.subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    // Check if category has products (you'll need to import Product model later)
    // const productCount = await Product.countDocuments({ category: category._id });
    // if (productCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     error: `Cannot delete category with ${productCount} products. Please reassign products first.`
    //   });
    // }

    // Delete category image from Cloudinary if exists
    if (category.image && category.image.public_id) {
      try {
        await cloudinary.uploader.destroy(category.image.public_id);
      } catch (cloudinaryError) {
        logger.warn('Failed to delete category image from Cloudinary:', cloudinaryError);
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    logger.info('Category deleted successfully', {
      categoryId: category._id,
      name: category.name,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting category'
    });
  }
};

// Upload category image (Admin only)
exports.uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Delete old image if exists
    if (category.image && category.image.public_id) {
      try {
        await cloudinary.uploader.destroy(category.image.public_id);
      } catch (error) {
        logger.warn('Failed to delete old category image:', error);
      }
    }

    // Upload new image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'categories',
          resource_type: 'image',
          transformation: [
            { width: 400, height: 300, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Update category with new image
    category.image = {
      public_id: result.public_id,
      secure_url: result.secure_url
    };

    await category.save();

    logger.info('Category image uploaded successfully', {
      categoryId: category._id,
      imagePublicId: result.public_id,
      uploadedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully',
      data: {
        image: category.image
      }
    });

  } catch (error) {
    logger.error('Upload category image error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error uploading image'
    });
  }
};

// Search categories
exports.searchCategories = async (req, res) => {
  try {
    const { q: query, cuisine, featured } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    let searchQuery = { isActive: true };

    // Add cuisine filter
    if (cuisine) {
      searchQuery.cuisine = cuisine;
    }

    // Add featured filter
    if (featured === 'true') {
      searchQuery.isFeatured = true;
    }

    // Perform search
    const categories = await Category.find({
      ...searchQuery,
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .populate('parentCategory', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: {
        categories,
        query: query.trim()
      }
    });

  } catch (error) {
    logger.error('Search categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching categories'
    });
  }
};


