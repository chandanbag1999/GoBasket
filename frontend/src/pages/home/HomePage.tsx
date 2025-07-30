import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Clock, Truck, Star } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Card } from '@/components/ui';

/**
 * Home Page Component
 * 
 * Features:
 * - Hero section with call-to-action
 * - Feature highlights
 * - Category showcase
 * - Featured products
 * - Mobile-first responsive design
 * - Smooth animations with Framer Motion
 */
const HomePage: React.FC = () => {
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <Container>
          <motion.div
            className="py-16 sm:py-24 text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              variants={itemVariants}
            >
              Fresh Groceries
              <br />
              <span className="text-orange-200">Delivered Fast</span>
            </motion.h1>
            
            <motion.p
              className="text-xl sm:text-2xl mb-8 text-orange-100 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Get your daily essentials delivered to your doorstep in 10-15 minutes
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <Button
                size="lg"
                variant="secondary"
                leftIcon={<ShoppingCart className="h-5 w-5" />}
                className="w-full sm:w-auto"
              >
                Start Shopping
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Download App
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20">
        <Container>
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              variants={itemVariants}
            >
              Why Choose GoBasket?
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Experience the future of grocery shopping with our quick commerce platform
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {/* Feature 1: Fast Delivery */}
            <motion.div variants={itemVariants}>
              <Card className="text-center p-8 h-full">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  10-15 Min Delivery
                </h3>
                <p className="text-gray-600">
                  Lightning-fast delivery to your doorstep. Fresh groceries in minutes, not hours.
                </p>
              </Card>
            </motion.div>

            {/* Feature 2: Fresh Products */}
            <motion.div variants={itemVariants}>
              <Card className="text-center p-8 h-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Fresh & Quality
                </h3>
                <p className="text-gray-600">
                  Hand-picked fresh produce and quality products. We ensure the best for your family.
                </p>
              </Card>
            </motion.div>

            {/* Feature 3: Free Delivery */}
            <motion.div variants={itemVariants}>
              <Card className="text-center p-8 h-full">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Free Delivery
                </h3>
                <p className="text-gray-600">
                  Free delivery on orders above ₹299. Save money while getting convenience.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              variants={itemVariants}
            >
              Shop by Category
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600"
              variants={itemVariants}
            >
              Explore our wide range of fresh products
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {/* Sample Categories */}
            {[
              { name: 'Fruits & Vegetables', emoji: '🥬', color: 'bg-green-100' },
              { name: 'Dairy & Eggs', emoji: '🥛', color: 'bg-blue-100' },
              { name: 'Meat & Seafood', emoji: '🍖', color: 'bg-red-100' },
              { name: 'Bakery', emoji: '🍞', color: 'bg-yellow-100' }
            ].map((category, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  className="text-center p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  clickable
                >
                  <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl">{category.emoji}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                    {category.name}
                  </h3>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-900 text-white">
        <Container>
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold mb-6"
              variants={itemVariants}
            >
              Ready to Start Shopping?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Join thousands of happy customers who trust GoBasket for their daily grocery needs
            </motion.p>
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                variant="primary"
                leftIcon={<ShoppingCart className="h-5 w-5" />}
              >
                Start Shopping Now
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
