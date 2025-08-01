import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package,
  Truck,
  Phone,
  MessageCircle,
  Navigation,
  User
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

// Utils
import { formatCurrency } from '@/lib/utils';

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);

  // Sample order data
  const order = {
    id: orderId || 'ORD001',
    date: '2024-01-20T10:30:00Z',
    status: 'out_for_delivery',
    items: [
      { name: 'Fresh Red Apples', quantity: 2, price: 120, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop' },
      { name: 'Organic Bananas', quantity: 1, price: 60, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop' },
    ],
    total: 450,
    deliveryAddress: '123 MG Road, Near City Mall, Bangalore - 560001',
    estimatedDelivery: '2024-01-20T11:00:00Z',
    deliveryPartner: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      rating: 4.8,
      vehicle: 'Bike - KA 01 AB 1234'
    }
  };

  const trackingSteps = [
    {
      id: 1,
      title: 'Order Placed',
      description: 'Your order has been confirmed',
      time: '10:30 AM',
      completed: true,
      icon: CheckCircle
    },
    {
      id: 2,
      title: 'Preparing',
      description: 'Your items are being prepared',
      time: '10:35 AM',
      completed: true,
      icon: Package
    },
    {
      id: 3,
      title: 'Out for Delivery',
      description: 'Your order is on the way',
      time: '10:45 AM',
      completed: currentStep >= 3,
      icon: Truck,
      active: currentStep === 3
    },
    {
      id: 4,
      title: 'Delivered',
      description: 'Order delivered successfully',
      time: 'Expected by 11:00 AM',
      completed: currentStep >= 4,
      icon: CheckCircle
    }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      }
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, [currentStep]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCallDeliveryPartner = () => {
    window.location.href = `tel:${order.deliveryPartner.phone}`;
  };

  const handleChatSupport = () => {
    navigate(`/support?order=${order.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} showLocation={false} showCart={false} showNotifications />

      <main className="pb-20">
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
                <VStack spacing="xs" className="flex-1">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Track Order
                  </h1>
                  <p className="text-sm text-gray-600">#{order.id}</p>
                </VStack>
              </HStack>
            </motion.div>

            {/* Live Tracking Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <VStack spacing="md">
                  <HStack spacing="sm" align="center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <VStack spacing="xs" className="flex-1">
                      <h2 className="text-lg font-bold text-white">
                        {trackingSteps.find(step => step.active)?.title || 'Order Confirmed'}
                      </h2>
                      <p className="text-green-100">
                        {trackingSteps.find(step => step.active)?.description || 'Your order is being processed'}
                      </p>
                    </VStack>
                  </HStack>

                  <div className="p-3 bg-white/10 rounded-lg">
                    <HStack spacing="sm" align="center">
                      <Clock className="w-4 h-4 text-white" />
                      <span className="text-white font-medium">
                        Estimated delivery: {formatDate(order.estimatedDelivery)}
                      </span>
                    </HStack>
                  </div>
                </VStack>
              </Card>
            </motion.div>

            {/* Tracking Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="lg">
                  <h3 className="text-lg font-semibold text-gray-900">Order Timeline</h3>
                  
                  <VStack spacing="md">
                    {trackingSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="relative">
                          <HStack spacing="md" align="start">
                            {/* Timeline Line */}
                            {index < trackingSteps.length - 1 && (
                              <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                                step.completed ? 'bg-green-500' : 'bg-gray-200'
                              }`} />
                            )}
                            
                            {/* Step Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              step.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : step.active
                                  ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                                  : 'bg-gray-100 border-gray-300 text-gray-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>

                            {/* Step Content */}
                            <VStack spacing="xs" className="flex-1">
                              <HStack justify="between" align="center">
                                <h4 className={`font-semibold ${
                                  step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {step.title}
                                </h4>
                                <span className={`text-sm ${
                                  step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                  {step.time}
                                </span>
                              </HStack>
                              <p className={`text-sm ${
                                step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {step.description}
                              </p>
                            </VStack>
                          </HStack>
                        </div>
                      );
                    })}
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Delivery Partner Info */}
            {currentStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card variant="default" padding="lg">
                  <VStack spacing="md">
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Partner</h3>
                    
                    <HStack spacing="md" align="center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      
                      <VStack spacing="xs" className="flex-1">
                        <h4 className="font-semibold text-gray-900">{order.deliveryPartner.name}</h4>
                        <HStack spacing="sm" align="center">
                          <span className="text-sm text-gray-600">{order.deliveryPartner.vehicle}</span>
                          <Badge variant="success" size="sm">
                            ⭐ {order.deliveryPartner.rating}
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCallDeliveryPartner}
                        leftIcon={<Phone className="w-4 h-4" />}
                      >
                        Call Partner
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleChatSupport}
                        leftIcon={<MessageCircle className="w-4 h-4" />}
                      >
                        Chat Support
                      </Button>
                    </div>
                  </VStack>
                </Card>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                  
                  <VStack spacing="sm">
                    {order.items.map((item, index) => (
                      <HStack key={index} spacing="sm" align="center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <VStack spacing="xs" className="flex-1">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity} • {formatCurrency(item.price)}
                          </span>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>

                  <Divider />

                  <HStack justify="between" align="center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </HStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                  
                  <HStack spacing="sm" align="start">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <p className="text-gray-700 leading-relaxed">{order.deliveryAddress}</p>
                  </HStack>

                  <Button
                    variant="outline"
                    leftIcon={<Navigation className="w-4 h-4" />}
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
                  >
                    View on Map
                  </Button>
                </VStack>
              </Card>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card variant="outlined" padding="lg" className="border-gray-200 bg-gray-50">
                <VStack spacing="md">
                  <h3 className="font-semibold text-gray-900 text-center">Need Help?</h3>
                  
                  <p className="text-sm text-gray-600 text-center">
                    Having issues with your order? Our support team is here to help.
                  </p>

                  <Button
                    variant="default"
                    fullWidth
                    onClick={handleChatSupport}
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                  >
                    Contact Support
                  </Button>
                </VStack>
              </Card>
            </motion.div>
          </VStack>
        </Container>
      </main>

      <BottomNavigation showLabels />
    </div>
  );
};

export default OrderTrackingPage;
