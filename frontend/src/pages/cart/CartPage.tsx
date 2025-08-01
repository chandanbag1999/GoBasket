import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  Tag,
  Truck,
  Clock,
  ArrowRight
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

// Hooks
import { useCart } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Enhanced Cart Page Component
 * 
 * Features:
 * - Beautiful cart items display
 * - Quantity management with animations
 * - Price calculation with discounts
 * - Delivery options
 * - Promo code application
 * - Checkout flow
 * - Empty cart state
 * - Mobile-optimized layout
 */
const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');

  const deliveryOptions = {
    standard: { label: 'Standard Delivery', time: '30-45 mins', price: 0 },
    express: { label: 'Express Delivery', time: '10-15 mins', price: 25 },
  };

  const promoDiscount = appliedPromo === 'SAVE10' ? 0.1 : 0;
  const deliveryFee = deliveryOptions[deliveryOption].price;
  const subtotal = total;
  const discount = subtotal * promoDiscount;
  const finalTotal = subtotal - discount + deliveryFee;

  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setAppliedPromo('SAVE10');
      setPromoCode('');
    } else {
      alert('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showSearch showLocation showCart showNotifications />
        
        <main className="pb-20">
          <Container size="sm" padding="lg" className="pt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              
              <VStack spacing="md">
                <h1 className="text-2xl font-bold text-gray-900">
                  Your cart is empty
                </h1>
                <p className="text-gray-600">
                  Add some delicious items to get started
                </p>
                
                <Link to="/app">
                  <Button variant="default" size="lg" className="mt-4">
                    Start Shopping
                  </Button>
                </Link>
              </VStack>
            </motion.div>
          </Container>
        </main>
        
        <BottomNavigation showLabels />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header showSearch={false} showLocation showCart={false} showNotifications />

      {/* Main Content */}
      <main className="pb-32">
        <Container size="7xl" padding="lg" className="pt-4">
          <VStack spacing="lg">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HStack spacing="md" align="center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900 flex-1">
                  Shopping Cart
                </h1>
                <Badge variant="primary" size="sm">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </Badge>
              </HStack>
            </motion.div>

            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <HStack justify="between" align="center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Items in Cart
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600"
                    >
                      Clear All
                    </Button>
                  </HStack>

                  <VStack spacing="md">
                    <AnimatePresence>
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <HStack spacing="md" align="center">
                              {/* Product Image */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Product Info */}
                              <VStack spacing="xs" className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(item.price)} each
                                </p>
                              </VStack>

                              {/* Quantity Controls */}
                              <HStack spacing="sm" align="center">
                                <motion.button
                                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                  onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Minus className="w-4 h-4" />
                                </motion.button>
                                
                                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                
                                <motion.button
                                  className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600"
                                  onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Plus className="w-4 h-4" />
                                </motion.button>
                              </HStack>

                              {/* Item Total */}
                              <VStack spacing="xs" align="end" className="flex-shrink-0">
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </VStack>
                            </HStack>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Delivery Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delivery Options
                  </h3>
                  
                  <VStack spacing="sm">
                    {Object.entries(deliveryOptions).map(([key, option]) => (
                      <motion.button
                        key={key}
                        className={`w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                          deliveryOption === key
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setDeliveryOption(key as any)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <HStack justify="between" align="center">
                          <HStack spacing="sm" align="center">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              deliveryOption === key
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}>
                              {deliveryOption === key && (
                                <div className="w-full h-full rounded-full bg-white scale-50" />
                              )}
                            </div>
                            <VStack spacing="xs" align="start">
                              <span className="font-medium text-gray-900">
                                {option.label}
                              </span>
                              <HStack spacing="xs" align="center">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {option.time}
                                </span>
                              </HStack>
                            </VStack>
                          </HStack>
                          <span className="font-semibold text-gray-900">
                            {option.price === 0 ? 'Free' : formatCurrency(option.price)}
                          </span>
                        </HStack>
                      </motion.button>
                    ))}
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Promo Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Promo Code
                  </h3>
                  
                  {appliedPromo ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <HStack justify="between" align="center">
                        <HStack spacing="sm" align="center">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            {appliedPromo} Applied
                          </span>
                        </HStack>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAppliedPromo(null)}
                          className="text-green-600"
                        >
                          Remove
                        </Button>
                      </HStack>
                    </div>
                  ) : (
                    <HStack spacing="sm">
                      <input
                        type="text"
                        placeholder="Enter promo code (try SAVE10)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim()}
                      >
                        Apply
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </Card>
            </motion.div>
          </VStack>
        </Container>
      </main>

      {/* Checkout Summary - Sticky Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="fixed bottom-16 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg"
      >
        <Container size="7xl" padding="lg">
          <VStack spacing="md">
            {/* Price Breakdown */}
            <VStack spacing="sm">
              <HStack justify="between" align="center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </HStack>
              
              {discount > 0 && (
                <HStack justify="between" align="center">
                  <span className="text-green-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(discount)}
                  </span>
                </HStack>
              )}
              
              <HStack justify="between" align="center">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-gray-900">
                  {deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}
                </span>
              </HStack>
              
              <Divider />
              
              <HStack justify="between" align="center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(finalTotal)}
                </span>
              </HStack>
            </VStack>

            {/* Checkout Button */}
            <Button
              variant="default"
              size="lg"
              fullWidth
              onClick={handleCheckout}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Proceed to Checkout
            </Button>
          </VStack>
        </Container>
      </motion.div>

      {/* Bottom Navigation */}
      <BottomNavigation showLabels />
    </div>
  );
};

export default CartPage;
