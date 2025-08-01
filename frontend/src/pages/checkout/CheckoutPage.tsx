import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  CreditCard,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import AddressSelector from '@/components/checkout/AddressSelector';
import PaymentMethods from '@/components/checkout/PaymentMethods';
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
 * Checkout Page Component - Complete Checkout Experience
 * 
 * Features:
 * - Step-by-step checkout process
 * - Address selection and management
 * - Payment method selection
 * - Order summary with pricing
 * - Security indicators and trust signals
 * - Mobile-optimized layout
 * - Progress indication
 * 
 * Usage:
 * /checkout - Accessible from cart page
 */
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, itemCount, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample addresses - in real app, this would come from API
  const addresses = [
    {
      id: 'addr-1',
      type: 'home' as const,
      name: 'John Doe',
      phone: '+91 98765 43210',
      addressLine1: '123 MG Road',
      addressLine2: 'Near City Mall',
      landmark: 'Opposite Metro Station',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: true,
    },
    {
      id: 'addr-2',
      type: 'work' as const,
      name: 'John Doe',
      phone: '+91 98765 43210',
      addressLine1: '456 Tech Park',
      addressLine2: 'Building A, Floor 5',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      isDefault: false,
    },
  ];

  const deliveryFee = 25;
  const platformFee = 5;
  const taxes = Math.round(total * 0.05); // 5% tax
  const finalTotal = total + deliveryFee + platformFee + taxes;

  const steps = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: CheckCircle },
  ];

  const handleContinue = () => {
    if (currentStep === 'address' && selectedAddressId) {
      setCurrentStep('payment');
    } else if (currentStep === 'payment' && selectedPaymentId) {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    setTimeout(() => {
      clearCart();
      navigate('/order-success', { 
        state: { 
          orderId: 'ORD' + Date.now(),
          total: finalTotal,
          items: items.length 
        }
      });
    }, 2000);
  };

  const canContinue = () => {
    switch (currentStep) {
      case 'address': return selectedAddressId !== '';
      case 'payment': return selectedPaymentId !== '';
      case 'review': return true;
      default: return false;
    }
  };

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header showSearch={false} showLocation={false} showCart={false} showNotifications />

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
                  onClick={() => navigate('/cart')}
                  className="text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900 flex-1">
                  Checkout
                </h1>
                <Badge variant="primary" size="sm">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </Badge>
              </HStack>
            </motion.div>

            {/* Progress Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card variant="default" padding="lg">
                <HStack spacing="md" justify="center">
                  {steps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const Icon = step.icon;
                    
                    return (
                      <React.Fragment key={step.id}>
                        <VStack spacing="xs" align="center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                            status === 'completed' 
                              ? 'bg-green-500 text-white' 
                              : status === 'current'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                          }`}>
                            {status === 'completed' ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            status === 'current' ? 'text-primary-600' : 'text-gray-600'
                          }`}>
                            {step.label}
                          </span>
                        </VStack>
                        
                        {index < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-4 ${
                            getStepStatus(steps[index + 1].id) === 'completed' || 
                            (getStepStatus(steps[index + 1].id) === 'current' && status === 'completed')
                              ? 'bg-green-500' 
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </HStack>
              </Card>
            </motion.div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="default" padding="lg">
                {currentStep === 'address' && (
                  <AddressSelector
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onAddressSelect={setSelectedAddressId}
                    onAddAddress={() => alert('Add address functionality')}
                    onEditAddress={(address) => alert(`Edit address: ${address.name}`)}
                    onDeleteAddress={(id) => alert(`Delete address: ${id}`)}
                  />
                )}

                {currentStep === 'payment' && (
                  <PaymentMethods
                    selectedMethodId={selectedPaymentId}
                    onMethodSelect={setSelectedPaymentId}
                    onAddCard={() => alert('Add card functionality')}
                    orderTotal={finalTotal}
                  />
                )}

                {currentStep === 'review' && (
                  <VStack spacing="lg">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review Your Order
                    </h3>
                    
                    {/* Order Items */}
                    <VStack spacing="sm">
                      <h4 className="font-medium text-gray-900">Items ({itemCount})</h4>
                      {items.map((item) => (
                        <HStack key={item.id} justify="between" align="center" className="py-2">
                          <HStack spacing="sm" align="center">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <VStack spacing="xs">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            </VStack>
                          </HStack>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </HStack>
                      ))}
                    </VStack>

                    <Divider />

                    {/* Selected Address */}
                    <VStack spacing="sm">
                      <h4 className="font-medium text-gray-900">Delivery Address</h4>
                      {selectedAddressId && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            {addresses.find(a => a.id === selectedAddressId)?.addressLine1}
                          </p>
                        </div>
                      )}
                    </VStack>

                    <Divider />

                    {/* Selected Payment */}
                    <VStack spacing="sm">
                      <h4 className="font-medium text-gray-900">Payment Method</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {selectedPaymentId === 'upi' && 'UPI Payment'}
                          {selectedPaymentId === 'card-1' && 'Credit/Debit Card'}
                          {selectedPaymentId === 'wallet' && 'Digital Wallet'}
                          {selectedPaymentId === 'cod' && 'Cash on Delivery'}
                        </p>
                      </div>
                    </VStack>
                  </VStack>
                )}
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card variant="outlined" padding="lg" className="border-primary-200 bg-primary-50">
                <VStack spacing="md">
                  <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  
                  <VStack spacing="sm">
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Items Total</span>
                      <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-gray-900">{formatCurrency(deliveryFee)}</span>
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-medium text-gray-900">{formatCurrency(platformFee)}</span>
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium text-gray-900">{formatCurrency(taxes)}</span>
                    </HStack>
                    
                    <Divider />
                    
                    <HStack justify="between" align="center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
                    </HStack>
                  </VStack>

                  {/* Delivery Time */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <HStack spacing="sm" align="center">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Estimated delivery: 10-15 minutes
                      </span>
                    </HStack>
                  </div>
                </VStack>
              </Card>
            </motion.div>
          </VStack>
        </Container>
      </main>

      {/* Continue Button - Sticky Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg"
      >
        <Container size="7xl" padding="lg">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={handleContinue}
            disabled={!canContinue() || isProcessing}
            loading={isProcessing}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {currentStep === 'address' && 'Continue to Payment'}
            {currentStep === 'payment' && 'Review Order'}
            {currentStep === 'review' && (isProcessing ? 'Processing...' : 'Place Order')}
          </Button>
        </Container>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;
