import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  ChevronRight,
  Timer,
  Percent
} from 'lucide-react';

// Components
import BlinkitHeader from '@/components/navigation/BlinkitHeader';
import BlinkitBottomNav from '@/components/navigation/BlinkitBottomNav';
import { Button } from '@/components/ui';
import Container from '@/components/layout/Container';

// Hooks
import { useCart } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

// Mock data
const categories = [
  { id: '1', name: 'Vegetables & Fruits', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300', color: 'bg-green-500' },
  { id: '2', name: 'Dairy & Breakfast', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300', color: 'bg-blue-500' },
  { id: '3', name: 'Munchies', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300', color: 'bg-orange-500' },
  { id: '4', name: 'Cold Drinks & Juices', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300', color: 'bg-purple-500' },
  { id: '5', name: 'Instant & Frozen Food', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300', color: 'bg-red-500' },
  { id: '6', name: 'Tea, Coffee & Health Drink', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300', color: 'bg-yellow-500' },
  { id: '7', name: 'Bakery & Biscuits', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', color: 'bg-pink-500' },
  { id: '8', name: 'Sweet Tooth', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300', color: 'bg-indigo-500' },
];

const products = [
  {
    id: '1',
    name: 'Fresh Red Apples',
    price: 120,
    originalPrice: 150,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300',
    category: 'Fruits',
    rating: 4.5,
    deliveryTime: '8 mins',
    unit: '1 kg'
  },
  {
    id: '2',
    name: 'Organic Bananas',
    price: 60,
    originalPrice: 80,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300',
    category: 'Fruits',
    rating: 4.3,
    deliveryTime: '8 mins',
    unit: '1 dozen'
  },
  {
    id: '3',
    name: 'Fresh Milk',
    price: 65,
    originalPrice: 70,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
    category: 'Dairy',
    rating: 4.7,
    deliveryTime: '8 mins',
    unit: '500 ml'
  },
  {
    id: '4',
    name: 'Brown Bread',
    price: 35,
    originalPrice: 40,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
    category: 'Bakery',
    rating: 4.4,
    deliveryTime: '8 mins',
    unit: '400g'
  },
  {
    id: '5',
    name: 'Potato Chips',
    price: 25,
    originalPrice: 30,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300',
    category: 'Snacks',
    rating: 4.2,
    deliveryTime: '8 mins',
    unit: '50g'
  },
  {
    id: '6',
    name: 'Orange Juice',
    price: 85,
    originalPrice: 100,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300',
    category: 'Beverages',
    rating: 4.6,
    deliveryTime: '8 mins',
    unit: '1L'
  }
];

/**
 * Professional Blinkit-Style Home Page
 * 
 * Features:
 * - Location header with delivery time
 * - Search functionality
 * - Category grid
 * - Product listings
 * - Quick add to cart
 * - Mobile-optimized design
 */
const BlinkitHomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, updateQuantity, removeItem, items } = useCart();

  const getCartItemCount = (productId: string) => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <BlinkitHeader />

      {/* Location & Delivery Info */}
      <div className="bg-green-50 border-b border-green-100">
        <Container>
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Delivery in 8 minutes</div>
                  <div className="text-xs text-gray-600">Koramangala, Bangalore</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-green-600 px-2 py-1 rounded-full">
                <Timer className="w-3 h-3 text-white" />
                <span className="text-xs font-medium text-white">8 mins</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={'Search "milk"'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="group"
            >
              <div className="text-center">
                <div className="relative mb-2">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
                <span className="text-xs font-medium text-gray-800 leading-tight block">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="bg-gray-50 mt-2 pb-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Popular Products</h2>
            <Link to="/products" className="text-green-600 text-sm font-medium flex items-center">
              see all
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
            
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => {
              const cartCount = getCartItemCount(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-100 rounded-lg p-3"
                >
                  <div className="relative mb-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {product.discount}% OFF
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-white bg-opacity-90 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-700 flex items-center">
                      <Timer className="w-2.5 h-2.5 mr-0.5" />
                      {product.deliveryTime}
                    </div>
                  </div>
                    
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-xs text-gray-500">{product.unit}</div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          ₹{product.price}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                        
                      {cartCount === 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="border border-green-600 text-green-600 px-3 py-1 rounded text-xs font-medium hover:bg-green-50"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center border border-green-600 rounded">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, cartCount - 1)}
                            className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-green-600 font-medium text-xs min-w-[24px] text-center bg-green-50">
                            {cartCount}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, cartCount + 1)}
                            className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BlinkitBottomNav />
    </div>
  );
};

export default BlinkitHomePage;
