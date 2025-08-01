import React, { useState, useEffect } from 'react';
import BlinkitCategoryGrid from '@/components/blinkit/BlinkitCategoryGrid';
import BlinkitProductCard from '@/components/blinkit/BlinkitProductCard';
import BlinkitBottomNav from '@/components/blinkit/BlinkitBottomNav';
import { ChevronRight, Star } from 'lucide-react';

// Import Blinkit theme
import '@/styles/blinkit-theme.css';

interface Product {
  id: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  unit: string;
  deliveryTime?: string;
  rating?: number;
  inStock?: boolean;
}

/**
 * Blinkit Home Page - Exact Mobile App Replica
 * Pixel-perfect copy of Blinkit's mobile home screen
 */
const BlinkitHomePage: React.FC = () => {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState('home');

  // Mock products data with working image URLs
  const featuredProducts: Product[] = [
    {
      id: 'amul-milk',
      name: 'Amul Gold Full Cream Fresh Milk',
      brand: 'Amul',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop&crop=center',
      price: 33,
      originalPrice: 35,
      unit: '500 ml',
      deliveryTime: '8 mins',
      rating: 4.3,
      inStock: true
    },
    {
      id: 'britannia-bread',
      name: 'Britannia 100% Whole Wheat Bread',
      brand: 'Britannia',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&crop=center',
      price: 25,
      originalPrice: 28,
      unit: '400 g',
      deliveryTime: '8 mins',
      rating: 4.1,
      inStock: true
    },
    {
      id: 'tata-salt',
      name: 'Tata Salt Lite, Low Sodium',
      brand: 'Tata',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop&crop=center',
      price: 20,
      originalPrice: 22,
      unit: '1 kg',
      deliveryTime: '8 mins',
      rating: 4.5,
      inStock: true
    },
    {
      id: 'maggi-noodles',
      name: 'Maggi 2-Minute Masala Noodles',
      brand: 'Maggi',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=300&fit=crop&crop=center',
      price: 14,
      originalPrice: 16,
      unit: '70 g',
      deliveryTime: '8 mins',
      rating: 4.2,
      inStock: true
    },
    {
      id: 'fresh-apples',
      name: 'Fresh Red Apples',
      brand: 'Fresh',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop&crop=center',
      price: 120,
      originalPrice: 150,
      unit: '1 kg',
      deliveryTime: '8 mins',
      rating: 4.4,
      inStock: true
    },
    {
      id: 'organic-bananas',
      name: 'Organic Bananas',
      brand: 'Organic',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop&crop=center',
      price: 60,
      originalPrice: 80,
      unit: '1 dozen',
      deliveryTime: '8 mins',
      rating: 4.3,
      inStock: true
    },
    {
      id: 'basmati-rice',
      name: 'Premium Basmati Rice',
      brand: 'India Gate',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop&crop=center',
      price: 180,
      originalPrice: 200,
      unit: '1 kg',
      deliveryTime: '8 mins',
      rating: 4.6,
      inStock: true
    },
    {
      id: 'green-tea',
      name: 'Organic Green Tea',
      brand: 'Twinings',
      image: 'https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=300&h=300&fit=crop&crop=center',
      price: 250,
      originalPrice: 280,
      unit: '100 g',
      deliveryTime: '8 mins',
      rating: 4.5,
      inStock: true
    }
  ];

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const getTotalCartItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <div className="pt-4">
        {/* Free Delivery Banner */}
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8"></div>
              <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white rounded-full"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">FREE Delivery</h3>
                  <p className="text-green-100 text-sm">On orders above ₹99</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-1 text-yellow-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">Fast Delivery</span>
                </div>
                <p className="text-green-100 text-xs mt-1">8 mins average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="bg-white mx-4 mb-6 rounded-2xl shadow-lg border border-gray-100">
          <BlinkitCategoryGrid
            categories={[]}
            onCategoryClick={(category) => console.log('Category clicked:', category)}
          />
        </div>

        {/* Featured Products Section */}
        <div className="bg-white mx-4 mb-6 rounded-2xl shadow-sm">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Bestsellers
                </h2>
                <p className="text-gray-600">
                  Most loved by customers
                </p>
              </div>
              <button className="flex items-center space-x-2 text-green-600 text-sm font-semibold bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors">
                <span>See all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <BlinkitProductCard
                    product={product}
                    quantity={cart[product.id] || 0}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onProductClick={(product) => console.log('Product clicked:', product)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Add Section */}
        <div className="bg-white mx-4 mb-6 rounded-2xl shadow-sm">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Quick Add
                </h2>
                <p className="text-gray-600">
                  Frequently bought items
                </p>
              </div>
            </div>

            {/* Quick Add Items */}
            <div className="space-y-4">
              {featuredProducts.slice(0, 3).map((product, index) => (
                <div
                  key={`quick-${product.id}`}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-xl shadow-sm"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{product.unit}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rating & Trust Section */}
        <div className="bg-white mx-4 mb-8 rounded-2xl shadow-sm">
          <div className="px-6 py-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">4.3</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Excellent Rating</p>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">1M+</div>
                  <p className="text-sm font-semibold text-gray-900">Happy Customers</p>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-2">8 min</div>
                  <p className="text-sm font-semibold text-gray-900">Avg Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BlinkitBottomNav 
        activeTab={activeTab}
        cartItemCount={getTotalCartItems()}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default BlinkitHomePage;
