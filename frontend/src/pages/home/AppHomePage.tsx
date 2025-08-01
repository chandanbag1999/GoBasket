import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Truck, 
  Star, 
  Gift,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import BannerCarousel from '@/components/home/BannerCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layout/Container';
import { VStack, HStack, Center } from '@/components/layout/Stack';

// Hooks
import { useAuth } from '@/hooks';

/**
 * App Home Page Component - Mobile-First E-commerce Experience
 * 
 * Features:
 * - Beautiful header with search and location
 * - Promotional banner carousel
 * - Category grid for easy browsing
 * - Quick action buttons
 * - Featured products section
 * - Bottom navigation
 * - Performance optimized
 * - Mobile-first responsive design
 */
const AppHomePage: React.FC = () => {
  const [greeting, setGreeting] = useState('');
  const { user, isAuthenticated } = useAuth();

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const quickActions = [
    {
      id: '1',
      title: '10-Min Delivery',
      subtitle: 'Express',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      link: '/express',
    },
    {
      id: '2',
      title: 'Best Offers',
      subtitle: 'Save More',
      icon: <Gift className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/offers',
    },
    {
      id: '3',
      title: 'Trending',
      subtitle: 'Popular',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/trending',
    },
    {
      id: '4',
      title: 'Wishlist',
      subtitle: 'Saved',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      link: '/wishlist',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showSearch 
        showLocation 
        showCart 
        showNotifications 
      />

      {/* Main Content */}
      <main className="pb-20">
        <VStack spacing="lg" className="pt-4">
          {/* Greeting Section */}
          <motion.div
            className="px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing="sm">
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting}{isAuthenticated && user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-gray-600">
                What would you like to order today?
              </p>
            </VStack>
          </motion.div>

          {/* Banner Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <BannerCarousel 
              autoPlay 
              showDots 
              height="180px" 
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <VStack spacing="md">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card 
                      variant="default" 
                      hover 
                      className="cursor-pointer"
                    >
                      <VStack spacing="xs" align="center" className="p-3">
                        <div className={`w-10 h-10 ${action.bgColor} rounded-xl flex items-center justify-center`}>
                          <div className={action.color}>
                            {action.icon}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 text-center">
                          {action.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {action.subtitle}
                        </span>
                      </VStack>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </VStack>
          </motion.div>

          {/* Categories Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CategoryGrid 
              title="Shop by Category" 
              variant="grid" 
              columns={3} 
              showAll 
            />
          </motion.div>

          {/* Featured Section */}
          <motion.div
            className="px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <VStack spacing="md">
              <HStack justify="between" align="center">
                <h2 className="text-lg font-semibold text-gray-900">Why Choose GoBasket?</h2>
              </HStack>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Feature Cards */}
                <Card variant="outlined" className="border-green-200 bg-green-50">
                  <HStack spacing="md" align="center" className="p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <VStack spacing="xs" className="flex-1">
                      <h3 className="font-semibold text-gray-900">10-Minute Delivery</h3>
                      <p className="text-sm text-gray-600">
                        Get your groceries delivered in just 10 minutes
                      </p>
                    </VStack>
                    <Badge variant="success" size="sm">Fast</Badge>
                  </HStack>
                </Card>

                <Card variant="outlined" className="border-blue-200 bg-blue-50">
                  <HStack spacing="md" align="center" className="p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <VStack spacing="xs" className="flex-1">
                      <h3 className="font-semibold text-gray-900">Fresh & Quality</h3>
                      <p className="text-sm text-gray-600">
                        Hand-picked fresh groceries from trusted vendors
                      </p>
                    </VStack>
                    <Badge variant="primary" size="sm">Quality</Badge>
                  </HStack>
                </Card>

                <Card variant="outlined" className="border-orange-200 bg-orange-50">
                  <HStack spacing="md" align="center" className="p-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-orange-600" />
                    </div>
                    <VStack spacing="xs" className="flex-1">
                      <h3 className="font-semibold text-gray-900">Free Delivery</h3>
                      <p className="text-sm text-gray-600">
                        Free delivery on orders above ₹500
                      </p>
                    </VStack>
                    <Badge variant="secondary" size="sm">Free</Badge>
                  </HStack>
                </Card>
              </div>
            </VStack>
          </motion.div>
        </VStack>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation showLabels />
    </div>
  );
};

export default AppHomePage;
