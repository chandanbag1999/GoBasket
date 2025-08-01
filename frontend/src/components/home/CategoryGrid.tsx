import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { VStack, HStack } from '@/components/layout/Stack';

/**
 * Category Interface
 */
interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  itemCount?: number;
  discount?: string;
  isPopular?: boolean;
  deliveryTime?: string;
}

/**
 * Category Grid Component Props
 */
interface CategoryGridProps {
  title?: string;
  showAll?: boolean;
  variant?: 'grid' | 'horizontal' | 'featured';
  columns?: 2 | 3 | 4;
}

/**
 * Professional Category Grid - Blinkit/BigBasket Style
 * 
 * Features:
 * - Touch-optimized category cards
 * - Smooth hover animations
 * - Popular category indicators
 * - Discount badges
 * - Item count display
 * - Responsive grid layout
 * - Loading states
 * 
 * Usage:
 * <CategoryGrid 
 *   title="Shop by Category" 
 *   variant="grid" 
 *   columns={3} 
 * />
 */
const CategoryGrid: React.FC<CategoryGridProps> = ({
  title = "Shop by Category",
  showAll = true,
  variant = 'grid',
  columns = 3,
}) => {
  // Sample categories data - in real app, this would come from API
  const categories: Category[] = [
    {
      id: '1',
      name: 'Fruits & Vegetables',
      emoji: '🥕',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      itemCount: 150,
      discount: '20% OFF',
      isPopular: true,
      deliveryTime: '10 mins',
    },
    {
      id: '2',
      name: 'Dairy & Eggs',
      emoji: '🥛',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      itemCount: 85,
      deliveryTime: '15 mins',
    },
    {
      id: '3',
      name: 'Meat & Seafood',
      emoji: '🍖',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      itemCount: 65,
      discount: '15% OFF',
      deliveryTime: '20 mins',
    },
    {
      id: '4',
      name: 'Bakery & Bread',
      emoji: '🍞',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      itemCount: 45,
      isPopular: true,
      deliveryTime: '12 mins',
    },
    {
      id: '5',
      name: 'Beverages',
      emoji: '🥤',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      itemCount: 120,
      deliveryTime: '10 mins',
    },
    {
      id: '6',
      name: 'Snacks & Chips',
      emoji: '🍿',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      itemCount: 95,
      discount: '25% OFF',
      deliveryTime: '8 mins',
    },
    {
      id: '7',
      name: 'Personal Care',
      emoji: '🧴',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      itemCount: 75,
      deliveryTime: '15 mins',
    },
    {
      id: '8',
      name: 'Household',
      emoji: '🧽',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      itemCount: 110,
      deliveryTime: '20 mins',
    },
  ];

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (variant === 'horizontal') {
    return (
      <VStack spacing="md">
        {/* Header */}
        <HStack justify="between" align="center" className="px-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {showAll && (
            <Link 
              to="/categories" 
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View All
            </Link>
          )}
        </HStack>

        {/* Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 px-4 pb-2">
            {categories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <Link to={`/category/${category.id}`}>
                  <Card 
                    variant="default" 
                    hover 
                    className="w-24 cursor-pointer"
                  >
                    <VStack spacing="sm" align="center" className="p-3">
                      <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center`}>
                        <span className="text-2xl">{category.emoji}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900 text-center leading-tight">
                        {category.name}
                      </span>
                      {category.discount && (
                        <Badge variant="error" size="sm" className="text-xs">
                          {category.discount}
                        </Badge>
                      )}
                    </VStack>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </VStack>
    );
  }

  return (
    <VStack spacing="md">
      {/* Header */}
      <HStack justify="between" align="center" className="px-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {showAll && (
          <Link 
            to="/categories" 
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            View All
          </Link>
        )}
      </HStack>

      {/* Grid Layout */}
      <motion.div
        className={`grid ${gridCols[columns]} gap-4 px-4`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={`/category/${category.id}`}>
              <Card 
                variant="default" 
                hover 
                className="cursor-pointer relative overflow-hidden"
              >
                <VStack spacing="sm" align="center" className="p-4">
                  {/* Popular Badge */}
                  {category.isPopular && (
                    <Badge 
                      variant="primary" 
                      size="sm" 
                      className="absolute top-2 right-2 text-xs"
                    >
                      Popular
                    </Badge>
                  )}

                  {/* Category Icon */}
                  <div className={`w-16 h-16 ${category.bgColor} rounded-2xl flex items-center justify-center mb-2`}>
                    <span className="text-3xl">{category.emoji}</span>
                  </div>

                  {/* Category Name */}
                  <h3 className="text-sm font-semibold text-gray-900 text-center leading-tight">
                    {category.name}
                  </h3>

                  {/* Item Count */}
                  {category.itemCount && (
                    <p className="text-xs text-gray-500">
                      {category.itemCount}+ items
                    </p>
                  )}

                  {/* Discount Badge */}
                  {category.discount && (
                    <Badge variant="error" size="sm" className="text-xs">
                      {category.discount}
                    </Badge>
                  )}

                  {/* Delivery Time */}
                  {category.deliveryTime && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {category.deliveryTime}
                      </span>
                    </div>
                  )}
                </VStack>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </VStack>
  );
};

export default CategoryGrid;
