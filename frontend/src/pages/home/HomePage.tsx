import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShoppingBag,
  Truck,
  Zap,
  Heart,
  Plus,
  Filter,
  ChevronRight,
  Timer,
  Percent,
  ArrowRight
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui';
import Container from '@/components/layout/Container';

// Hooks
import { useCart } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Home Page Component
 * 
 * Features:
 * - Hero section
 * - Feature highlights
 * - Call-to-action
 * - Mobile-optimized design
 */
const HomePage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: '10-Minute Delivery',
      description: 'Get groceries delivered in just 10 minutes',
    },
    {
      icon: Shield,
      title: 'Fresh & Safe',
      description: 'Quality-checked products with safety guarantee',
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'Free delivery on orders above ₹500',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-12 md:py-20">
        <Container>
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6"
            >
              India's fastest{' '}
              <span className="text-gradient">grocery delivery</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Fresh groceries delivered to your doorstep in minutes. 
              Shop from thousands of products at the best prices.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button size="lg" className="min-w-[200px]">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Download App
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
