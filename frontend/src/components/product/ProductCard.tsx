import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Heart,
  Clock,
  Truck,
  Tag
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { VStack, HStack } from '@/components/layout/Stack';

// Hooks
import { useCart } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Product Interface
 */
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  brand?: string;
  unit?: string;
  inStock: boolean;
  deliveryTime?: string;
  isOrganic?: boolean;
  isBestseller?: boolean;
  tags?: string[];
}

/**
 * Product Card Component Props
 */
interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showAddToCart?: boolean;
  showWishlist?: boolean;
  className?: string;
}

/**
 * Professional Product Card - Blinkit/BigBasket Style
 * 
 * Features:
 * - Beautiful product images with hover effects
 * - Price display with discounts
 * - Rating and review count
 * - Quick add to cart functionality
 * - Wishlist support
 * - Stock status indicators
 * - Delivery time display
 * - Mobile-optimized layout
 * 
 * Usage:
 * <ProductCard 
 *   product={product} 
 *   variant="default" 
 *   showAddToCart 
 *   showWishlist 
 * />
 */
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'default',
  showAddToCart = true,
  showWishlist = true,
  className,
}) => {
  const [quantity, setQuantity] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { addItem, updateQuantity, items } = useCart();

  // Check if product is already in cart
  const cartItem = items.find(item => item.id === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (currentQuantity === 0) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        restaurantId: 'grocery-store', // For grocery items
        restaurantName: 'GoBasket Store',
      }, 1);
    } else {
      updateQuantity(product.id, currentQuantity + 1);
    }
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      updateQuantity(product.id, 0);
    } else {
      updateQuantity(product.id, newQuantity);
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // In real app, this would call an API
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        variant="default" 
        hover 
        className="cursor-pointer relative overflow-hidden h-full"
      >
        <Link to={`/product/${product.id}`}>
          <VStack spacing="sm" className="p-4 h-full">
            {/* Badges */}
            <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1">
              {discountPercentage > 0 && (
                <Badge variant="error" size="sm">
                  {discountPercentage}% OFF
                </Badge>
              )}
              {product.isBestseller && (
                <Badge variant="primary" size="sm">
                  Bestseller
                </Badge>
              )}
              {product.isOrganic && (
                <Badge variant="success" size="sm">
                  Organic
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            {showWishlist && (
              <motion.button
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleWishlistToggle();
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart 
                  className={`w-4 h-4 ${
                    isWishlisted 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-600'
                  }`} 
                />
              </motion.button>
            )}

            {/* Product Image */}
            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
              )}
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <VStack spacing="xs" className="flex-1 w-full">
              {/* Brand */}
              {product.brand && (
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {product.brand}
                </p>
              )}

              {/* Product Name */}
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                {product.name}
              </h3>

              {/* Unit */}
              {product.unit && (
                <p className="text-xs text-gray-600">{product.unit}</p>
              )}

              {/* Rating */}
              <HStack spacing="xs" align="center">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs font-medium text-gray-700">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount})
                </span>
              </HStack>

              {/* Price */}
              <VStack spacing="xs">
                <HStack spacing="sm" align="center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </HStack>
              </VStack>

              {/* Delivery Info */}
              {product.deliveryTime && (
                <HStack spacing="xs" align="center">
                  <Clock className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {product.deliveryTime}
                  </span>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Link>

        {/* Add to Cart Section */}
        {showAddToCart && product.inStock && (
          <div className="p-4 pt-0">
            {currentQuantity === 0 ? (
              <Button
                variant="default"
                size="sm"
                fullWidth
                onClick={handleAddToCart}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add to Cart
              </Button>
            ) : (
              <HStack spacing="sm" justify="between" align="center">
                <motion.button
                  className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600"
                  onClick={() => handleUpdateQuantity(currentQuantity - 1)}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                
                <span className="text-sm font-semibold text-gray-900 min-w-[2rem] text-center">
                  {currentQuantity}
                </span>
                
                <motion.button
                  className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white"
                  onClick={() => handleUpdateQuantity(currentQuantity + 1)}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </HStack>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ProductCard;
