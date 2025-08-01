import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Package, 
  Clock, 
  MapPin,
  Phone,
  Share,
  Download,
  ArrowRight,
  Home
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Order Success Page Component - Celebration & Information
 * 
 * Features:
 * - Beautiful success animation
 * - Order details and tracking info
 * - Estimated delivery time
 * - Contact and support options
 * - Share order functionality
 * - Continue shopping options
 * - Mobile-optimized layout
 */
const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showConfetti, setShowConfetti] = useState(true);
  
  // Get order data from navigation state
  const orderData = location.state || {
    orderId: 'ORD123456789',
    total: 299,
    items: 3,
  };

  const { orderId, total, items } = orderData;

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no order data
  useEffect(() => {
    if (!location.state) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);

  const estimatedDelivery = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Order Placed Successfully!',
        text: `I just placed an order on GoBasket! Order ID: ${orderId}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Order placed successfully! Order ID: ${orderId}`);
      alert('Order details copied to clipboard!');
    }
  };

  const handleDownloadReceipt = () => {
    // In real app, this would generate and download a PDF receipt
    alert('Receipt download functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 10,
                rotate: 360,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: "easeOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      <Container size="sm" padding="lg" className="py-8">
        <VStack spacing="lg">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.2 
            }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Placed! 🎉
              </h1>
              <p className="text-lg text-gray-600">
                Thank you for your order
              </p>
            </motion.div>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="elevated" padding="lg">
              <VStack spacing="lg">
                {/* Order Header */}
                <VStack spacing="sm" align="center">
                  <Badge variant="success" size="lg">
                    Order Confirmed
                  </Badge>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order #{orderId}
                  </h2>
                  <p className="text-gray-600">
                    {items} item{items !== 1 ? 's' : ''} • {formatCurrency(total)}
                  </p>
                </VStack>

                <Divider />

                {/* Delivery Information */}
                <VStack spacing="md">
                  <h3 className="font-semibold text-gray-900">Delivery Information</h3>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <VStack spacing="sm">
                      <HStack spacing="sm" align="center">
                        <Clock className="w-5 h-5 text-green-600" />
                        <VStack spacing="xs" className="flex-1">
                          <span className="font-medium text-green-800">
                            Estimated Delivery
                          </span>
                          <span className="text-sm text-green-700">
                            {estimatedDelivery.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} (10-15 minutes)
                          </span>
                        </VStack>
                      </HStack>
                    </VStack>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <HStack spacing="sm" align="center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <VStack spacing="xs" className="flex-1">
                        <span className="font-medium text-blue-800">
                          Delivering to
                        </span>
                        <span className="text-sm text-blue-700">
                          123 MG Road, Near City Mall, Bangalore - 560001
                        </span>
                      </VStack>
                    </HStack>
                  </div>
                </VStack>

                <Divider />

                {/* Order Tracking */}
                <VStack spacing="md">
                  <h3 className="font-semibold text-gray-900">Order Status</h3>
                  
                  <VStack spacing="sm">
                    {[
                      { status: 'Order Placed', time: 'Just now', completed: true },
                      { status: 'Preparing', time: '2-3 mins', completed: false },
                      { status: 'Out for Delivery', time: '8-10 mins', completed: false },
                      { status: 'Delivered', time: '10-15 mins', completed: false },
                    ].map((step, index) => (
                      <HStack key={index} spacing="sm" align="center">
                        <div className={`w-4 h-4 rounded-full ${
                          step.completed 
                            ? 'bg-green-500' 
                            : 'bg-gray-200'
                        }`} />
                        <VStack spacing="xs" className="flex-1">
                          <span className={`font-medium ${
                            step.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {step.time}
                          </span>
                        </VStack>
                        {step.completed && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </VStack>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <VStack spacing="md">
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  leftIcon={<Share className="w-4 h-4" />}
                >
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadReceipt}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Receipt
                </Button>
              </div>

              {/* Track Order */}
              <Button
                variant="default"
                size="lg"
                fullWidth
                onClick={() => navigate(`/order-tracking/${orderId}`)}
                rightIcon={<Package className="w-4 h-4" />}
              >
                Track Your Order
              </Button>

              {/* Continue Shopping */}
              <Link to="/app" className="w-full">
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  leftIcon={<Home className="w-4 h-4" />}
                >
                  Continue Shopping
                </Button>
              </Link>
            </VStack>
          </motion.div>

          {/* Support Information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Card variant="outlined" padding="lg" className="border-gray-200 bg-gray-50">
              <VStack spacing="md">
                <h3 className="font-semibold text-gray-900 text-center">
                  Need Help?
                </h3>
                
                <VStack spacing="sm">
                  <HStack spacing="sm" align="center" justify="center">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Call us: +91 1800-123-4567
                    </span>
                  </HStack>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Available 24/7 for order support
                  </p>
                </VStack>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/support')}
                  >
                    Contact Support
                  </Button>
                </div>
              </VStack>
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <Card variant="default" padding="lg">
              <VStack spacing="md">
                <h3 className="font-semibold text-gray-900">Order Summary</h3>
                
                <VStack spacing="sm">
                  <HStack justify="between" align="center">
                    <span className="text-gray-600">Items ({items})</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(total - 30)} {/* Assuming 30 for fees */}
                    </span>
                  </HStack>
                  
                  <HStack justify="between" align="center">
                    <span className="text-gray-600">Delivery & Fees</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(30)}
                    </span>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="between" align="center">
                    <span className="text-lg font-semibold text-gray-900">Total Paid</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(total)}
                    </span>
                  </HStack>
                </VStack>
              </VStack>
            </Card>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center py-4"
          >
            <p className="text-gray-600">
              Thank you for choosing GoBasket! 🛒
            </p>
            <p className="text-sm text-gray-500 mt-1">
              We're preparing your order with care
            </p>
          </motion.div>
        </VStack>
      </Container>
    </div>
  );
};

export default OrderSuccessPage;
