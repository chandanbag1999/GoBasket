const Category = require("../models/Category");
const Product = require("../models/Product");

class CategoryController {
  // Get all categories with hierarchy
  async getCategories(req, res) {
    try {
      const { level, includeProductCount = false } = req.query;

      let categories = await Category.findActiveCategories(
        level ? parseInt(level) : null
      );

      if (includeProductCount === "true") {
        categories = await Category.populate(categories, {
          path: "productCount",
        });
      }

      // Build hierarchy if no level specified
      if (!level) {
        categories = this.buildCategoryHierarchy(categories);
      }

      res.status(200).json({
        status: "success",
        data: { categories },
      });
    } catch (error) {
      console.error("❌ Get categories error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch categories",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get category by slug with subcategories
  async getCategory(req, res) {
    try {
      const { slug } = req.params;

      const category = await Category.findBySlug(slug);
      if (!category) {
        return res.status(404).json({
          status: "error",
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND",
        });
      }

      // Get product count
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true,
      });

      // Get subcategories with product counts
      const subcategories = await Category.find({
        parentCategory: category._id,
        isActive: true,
      }).sort({ sortOrder: 1, name: 1 });

      const subcategoriesWithCounts = await Promise.all(
        subcategories.map(async (subcat) => {
          const count = await Product.countDocuments({
            subcategory: subcat._id,
            isActive: true,
          });
          return { ...subcat.toObject(), productCount: count };
        })
      );

      res.status(200).json({
        status: "success",
        data: {
          category: {
            ...category.toObject(),
            productCount,
          },
          subcategories: subcategoriesWithCounts,
        },
      });
    } catch (error) {
      console.error("❌ Get category error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch category details",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Get category tree for navigation
  async getCategoryTree(req, res) {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean();

      const tree = this.buildCategoryTree(categories);

      res.status(200).json({
        status: "success",
        data: { tree },
      });
    } catch (error) {
      console.error("❌ Get category tree error:", error);

      res.status(500).json({
        status: "error",
        message: "Failed to fetch category tree",
        ...(process.env.NODE_ENV === "development" && { error: error.message }),
      });
    }
  }

  // Build category hierarchy helper
  buildCategoryHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create map for quick lookup
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), { ...cat.toObject(), children: [] });
    });

    // Build hierarchy
    categories.forEach((cat) => {
      const category = categoryMap.get(cat._id.toString());

      if (cat.parentCategory) {
        const parent = categoryMap.get(cat.parentCategory.toString());
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  // Build category tree helper
  buildCategoryTree(categories) {
    const tree = [];
    const categoryMap = {};

    // Create map for quick lookup
    categories.forEach((cat) => {
      categoryMap[cat._id] = {
        ...cat,
        children: [],
      };
    });

    // Build tree structure
    categories.forEach((cat) => {
      if (cat.parentCategory) {
        const parent = categoryMap[cat.parentCategory];
        if (parent) {
          parent.children.push(categoryMap[cat._id]);
        }
      } else {
        tree.push(categoryMap[cat._id]);
      }
    });

    return tree;
  }
}

module.exports = new CategoryController();
