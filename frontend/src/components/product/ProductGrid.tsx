import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid, 
  List, 
  SlidersHorizontal,
  ArrowUpDown,
  Filter
} from 'lucide-react';

// Components
import ProductCard from './ProductCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { VStack, HStack } from '@/components/layout/Stack';

/**
 * Product Grid Component Props
 */
interface ProductGridProps {
  products: any[]; // Product interface from ProductCard
  title?: string;
  showFilters?: boolean;
  showSort?: boolean;
  showViewToggle?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Sort Options
 */
const sortOptions = [
  { id: 'relevance', label: 'Relevance', value: 'relevance' },
  { id: 'price-low', label: 'Price: Low to High', value: 'price-asc' },
  { id: 'price-high', label: 'Price: High to Low', value: 'price-desc' },
  { id: 'rating', label: 'Customer Rating', value: 'rating-desc' },
  { id: 'newest', label: 'Newest First', value: 'created-desc' },
  { id: 'discount', label: 'Discount', value: 'discount-desc' },
];

/**
 * Professional Product Grid - E-commerce Display
 * 
 * Features:
 * - Responsive grid layout
 * - Sort and filter controls
 * - Grid/List view toggle
 * - Loading states
 * - Empty states
 * - Smooth animations
 * - Mobile-optimized
 * 
 * Usage:
 * <ProductGrid 
 *   products={products} 
 *   title="Fresh Fruits" 
 *   showFilters 
 *   showSort 
 * />
 */
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  title,
  showFilters = true,
  showSort = true,
  showViewToggle = true,
  loading = false,
  emptyMessage = "No products found",
  className,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleSortChange = (sortValue: string) => {
    setSortBy(sortValue);
    setShowSortMenu(false);
    // In real app, this would trigger a re-fetch or re-sort
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

  // Loading skeleton
  if (loading) {
    return (
      <VStack spacing="lg" className={className}>
        {/* Header Skeleton */}
        {title && (
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        )}
        
        {/* Controls Skeleton */}
        <HStack spacing="md" justify="between">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </HStack>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse mb-3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </VStack>
    );
  }

  // Empty state
  if (!loading && products.length === 0) {
    return (
      <VStack spacing="lg" className={`text-center py-12 ${className}`}>
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">🛒</span>
        </div>
        <VStack spacing="sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {emptyMessage}
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </VStack>
        <Button variant="outline">
          Clear Filters
        </Button>
      </VStack>
    );
  }

  return (
    <VStack spacing="lg" className={className}>
      {/* Header */}
      {title && (
        <HStack justify="between" align="center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <Badge variant="secondary" size="sm">
            {products.length} items
          </Badge>
        </HStack>
      )}

      {/* Controls */}
      <HStack spacing="md" justify="between" align="center" className="flex-wrap gap-2">
        {/* Filter & Sort */}
        <HStack spacing="sm">
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
          )}

          {showSort && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowUpDown className="w-4 h-4" />}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
              </Button>

              {/* Sort Dropdown */}
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]"
                >
                  <VStack spacing="none">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                        }`}
                        onClick={() => handleSortChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </VStack>
                </motion.div>
              )}
            </div>
          )}
        </HStack>

        {/* View Toggle */}
        {showViewToggle && (
          <HStack spacing="xs">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Product Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'flex flex-col space-y-4'
        }
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className={viewMode === 'list' ? 'w-full' : ''}
          >
            <ProductCard
              product={product}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              showAddToCart
              showWishlist
              className="h-full"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {products.length > 0 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            Load More Products
          </Button>
        </div>
      )}
    </VStack>
  );
};

export default ProductGrid;
