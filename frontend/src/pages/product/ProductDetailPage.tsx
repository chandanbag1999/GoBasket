import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Share,
  ShoppingCart,
  Heart
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductVariants from '@/components/product/ProductVariants';
import ProductReviews from '@/components/product/ProductReviews';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

// Hooks
import { useCart, useAuth } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Product Detail Page - Complete Product Experience
 * 
 * Features:
 * - Beautiful image gallery with zoom
 * - Product information and specifications
 * - Variant selection (size, color, etc.)
 * - Reviews and ratings
 * - Related products
 * - Add to cart functionality
 * - Share and wishlist
 * - Mobile-optimized layout
 */
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'related'>('details');

  // Sample product data - in real app, this would come from API
  const product = {
    id: id || '1',
    name: 'Fresh Red Apples',
    description: 'Crispy and sweet red apples, perfect for snacking or cooking. Sourced from the finest orchards.',
    price: 120,
    originalPrice: 150,
    rating: 4.5,
    reviewCount: 234,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop',
        alt: 'Fresh Red Apples',
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=600&h=600&fit=crop',
        alt: 'Apple close-up',
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&h=600&fit=crop',
        alt: 'Apple basket',
      },
    ],
    category: 'fruits',
    brand: 'Fresh Farm',
    inStock: true,
    deliveryTime: '10 mins',
    isOrganic: true,
    isBestseller: true,
    discount: 20,
    specifications: {
      'Origin': 'Kashmir, India',
      'Variety': 'Red Delicious',
      'Shelf Life': '7-10 days',
      'Storage': 'Refrigerate for best quality',
      'Nutritional Info': 'Rich in fiber, vitamin C, and antioxidants',
    },
    variants: [
      {
        id: 'weight',
        name: 'Weight',
        type: 'weight' as const,
        required: true,
        options: [
          { id: '500g', label: '500g', value: '500g', price: 0, inStock: true },
          { id: '1kg', label: '1kg', value: '1kg', price: 60, inStock: true },
          { id: '2kg', label: '2kg', value: '2kg', price: 100, inStock: true },
          { id: '5kg', label: '5kg', value: '5kg', price: 200, inStock: false },
        ],
      },
    ],
  };

  // Sample reviews data
  const reviews = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Priya Sharma',
      rating: 5,
      title: 'Excellent quality apples!',
      comment: 'These apples are incredibly fresh and crispy. Perfect sweetness and delivered quickly. Will definitely order again!',
      date: '2024-01-15',
      verified: true,
      helpful: 12,
      notHelpful: 1,
      variant: '1kg',
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Rahul Kumar',
      rating: 4,
      title: 'Good value for money',
      comment: 'Fresh apples at a reasonable price. The delivery was on time and packaging was good.',
      date: '2024-01-10',
      verified: true,
      helpful: 8,
      notHelpful: 0,
      variant: '500g',
    },
  ];

  // Sample related products
  const relatedProducts = [
    {
      id: '2',
      name: 'Organic Bananas',
      price: 60,
      rating: 4.3,
      reviewCount: 156,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop',
      category: 'fruits',
      brand: 'Organic Valley',
      unit: '1 dozen',
      inStock: true,
      deliveryTime: '15 mins',
      isOrganic: true,
    },
    {
      id: '3',
      name: 'Fresh Oranges',
      price: 80,
      originalPrice: 100,
      rating: 4.6,
      reviewCount: 89,
      image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=300&fit=crop',
      category: 'fruits',
      brand: 'Citrus Fresh',
      unit: '1 kg',
      inStock: true,
      deliveryTime: '12 mins',
    },
  ];

  const handleVariantChange = (groupId: string, optionId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [groupId]: optionId,
    }));
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: calculateTotalPrice(),
      image: product.images[0].url,
      restaurantId: 'grocery-store',
      restaurantName: 'GoBasket Store',
    }, quantity);
    
    // Show success feedback
    alert('Added to cart! 🛒');
  };

  const calculateTotalPrice = () => {
    let totalPrice = product.price;
    
    product.variants.forEach(group => {
      const selectedOptionId = selectedVariants[group.id];
      if (selectedOptionId) {
        const selectedOption = group.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption?.price) {
          totalPrice += selectedOption.price;
        }
      }
    });
    
    return totalPrice;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // In real app, this would call an API
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showSearch={false}
        showLocation 
        showCart 
        showNotifications 
      />

      {/* Main Content */}
      <main className="pb-24">
        <Container size="7xl" padding="lg" className="pt-4">
          <VStack spacing="lg">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            </motion.div>

            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProductImageGallery
                images={product.images}
                productName={product.name}
                discount={discountPercentage}
                isNew={false}
                isBestseller={product.isBestseller}
                onShare={handleShare}
                onWishlist={handleWishlist}
                isWishlisted={isWishlisted}
              />
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  {/* Brand & Category */}
                  <HStack spacing="sm" align="center">
                    <Badge variant="secondary" size="sm">{product.brand}</Badge>
                    <Badge variant="outline" size="sm">{product.category}</Badge>
                    {product.isOrganic && (
                      <Badge variant="success" size="sm">Organic</Badge>
                    )}
                  </HStack>

                  {/* Product Name */}
                  <h1 className="text-2xl font-bold text-gray-900">
                    {product.name}
                  </h1>

                  {/* Rating & Reviews */}
                  <HStack spacing="md" align="center">
                    <HStack spacing="sm" align="center">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-gray-600">
                        ({product.reviewCount} reviews)
                      </span>
                    </HStack>
                    <Divider orientation="vertical" className="h-4" />
                    <span className="text-green-600 font-medium">
                      ✓ {product.deliveryTime} delivery
                    </span>
                  </HStack>

                  {/* Price */}
                  <HStack spacing="md" align="center">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(calculateTotalPrice())}
                    </span>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                        <Badge variant="error" size="sm">
                          {discountPercentage}% OFF
                        </Badge>
                      </>
                    )}
                  </HStack>

                  {/* Description */}
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </VStack>
              </Card>
            </motion.div>

            {/* Product Variants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card variant="default" padding="lg">
                <ProductVariants
                  variants={product.variants}
                  basePrice={product.price}
                  onVariantChange={handleVariantChange}
                  onQuantityChange={setQuantity}
                  selectedVariants={selectedVariants}
                  quantity={quantity}
                />
              </Card>
            </motion.div>

            {/* Add to Cart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="sticky bottom-20 z-10"
            >
              <Card variant="elevated" padding="lg" className="border-t-4 border-primary-500">
                <HStack spacing="md">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlist}
                    className="flex-shrink-0"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="default"
                    size="lg"
                    fullWidth
                    onClick={handleAddToCart}
                    leftIcon={<ShoppingCart className="w-5 h-5" />}
                  >
                    Add to Cart • {formatCurrency(calculateTotalPrice() * quantity)}
                  </Button>
                </HStack>
              </Card>
            </motion.div>

            {/* Tabs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <VStack spacing="md">
                {/* Tab Navigation */}
                <HStack spacing="sm" className="border-b border-gray-200">
                  {[
                    { id: 'details', label: 'Details' },
                    { id: 'reviews', label: 'Reviews' },
                    { id: 'related', label: 'Related' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'text-primary-600 border-primary-600'
                          : 'text-gray-600 border-transparent hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </HStack>

                {/* Tab Content */}
                {activeTab === 'details' && (
                  <Card variant="default" padding="lg">
                    <VStack spacing="md">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Product Specifications
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <HStack key={key} justify="between" align="start">
                            <span className="font-medium text-gray-700 min-w-0 flex-1">
                              {key}:
                            </span>
                            <span className="text-gray-600 text-right min-w-0 flex-1">
                              {value}
                            </span>
                          </HStack>
                        ))}
                      </div>
                    </VStack>
                  </Card>
                )}

                {activeTab === 'reviews' && (
                  <ProductReviews
                    productId={product.id}
                    averageRating={product.rating}
                    totalReviews={product.reviewCount}
                    ratingDistribution={{ 5: 150, 4: 60, 3: 20, 2: 3, 1: 1 }}
                    reviews={reviews}
                  />
                )}

                {activeTab === 'related' && (
                  <VStack spacing="md">
                    <h3 className="text-lg font-semibold text-gray-900">
                      You might also like
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {relatedProducts.map((relatedProduct) => (
                        <ProductCard
                          key={relatedProduct.id}
                          product={relatedProduct}
                          showAddToCart
                          showWishlist
                        />
                      ))}
                    </div>
                  </VStack>
                )}
              </VStack>
            </motion.div>
          </VStack>
        </Container>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation showLabels />
    </div>
  );
};

export default ProductDetailPage;
