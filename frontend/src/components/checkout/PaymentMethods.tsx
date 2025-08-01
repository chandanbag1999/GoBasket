import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote,
  Shield,
  Check,
  Plus,
  Lock
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { VStack, HStack } from '@/components/layout/Stack';

/**
 * Payment Method Interface
 */
interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'cod' | 'netbanking';
  name: string;
  description: string;
  icon: React.ReactNode;
  isPopular?: boolean;
  processingFee?: number;
  estimatedTime?: string;
  details?: {
    cardNumber?: string;
    expiryDate?: string;
    upiId?: string;
    walletBalance?: number;
  };
}

/**
 * Payment Methods Component Props
 */
interface PaymentMethodsProps {
  selectedMethodId?: string;
  onMethodSelect?: (methodId: string) => void;
  onAddCard?: () => void;
  orderTotal: number;
}

/**
 * Professional Payment Methods - Secure Checkout Component
 * 
 * Features:
 * - Multiple payment options (Card, UPI, Wallet, COD)
 * - Security indicators and trust signals
 * - Processing fees and time estimates
 * - Popular payment method highlighting
 * - Mobile-optimized layout
 * - Smooth animations
 * 
 * Usage:
 * <PaymentMethods 
 *   selectedMethodId={selectedId}
 *   onMethodSelect={handleSelect}
 *   orderTotal={totalAmount}
 * />
 */
const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  selectedMethodId,
  onMethodSelect,
  onAddCard,
  orderTotal,
}) => {
  // Sample payment methods - in real app, this would come from API
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      type: 'upi',
      name: 'UPI',
      description: 'Pay using any UPI app',
      icon: <Smartphone className="w-5 h-5" />,
      isPopular: true,
      estimatedTime: 'Instant',
    },
    {
      id: 'card-1',
      type: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, RuPay',
      icon: <CreditCard className="w-5 h-5" />,
      details: {
        cardNumber: '**** **** **** 1234',
        expiryDate: '12/25',
      },
      estimatedTime: 'Instant',
    },
    {
      id: 'wallet',
      type: 'wallet',
      name: 'Digital Wallet',
      description: 'Paytm, PhonePe, Google Pay',
      icon: <Wallet className="w-5 h-5" />,
      details: {
        walletBalance: 2500,
      },
      estimatedTime: 'Instant',
    },
    {
      id: 'cod',
      type: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive',
      icon: <Banknote className="w-5 h-5" />,
      processingFee: 20,
      estimatedTime: 'On delivery',
    },
  ];

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'upi': return 'text-blue-600 bg-blue-50';
      case 'card': return 'text-purple-600 bg-purple-50';
      case 'wallet': return 'text-green-600 bg-green-50';
      case 'cod': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotal = (method: PaymentMethod) => {
    return orderTotal + (method.processingFee || 0);
  };

  return (
    <VStack spacing="lg">
      {/* Header */}
      <HStack spacing="sm" align="center">
        <Shield className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Payment Method
        </h3>
        <Badge variant="success" size="sm">
          Secure
        </Badge>
      </HStack>

      {/* Payment Methods List */}
      <VStack spacing="sm">
        {paymentMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <motion.div
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedMethodId === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onMethodSelect?.(method.id)}
              whileTap={{ scale: 0.98 }}
            >
              {/* Popular Badge */}
              {method.isPopular && (
                <div className="absolute -top-2 left-4">
                  <Badge variant="primary" size="sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Selection Indicator */}
              <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                selectedMethodId === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethodId === method.id && (
                  <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                )}
              </div>

              <VStack spacing="sm">
                {/* Method Header */}
                <HStack spacing="sm" align="center">
                  <div className={`p-2 rounded-lg ${getMethodColor(method.type)}`}>
                    {method.icon}
                  </div>
                  
                  <VStack spacing="xs" className="flex-1">
                    <HStack spacing="sm" align="center">
                      <span className="font-semibold text-gray-900">
                        {method.name}
                      </span>
                      <Lock className="w-3 h-3 text-gray-400" />
                    </HStack>
                    <p className="text-sm text-gray-600">
                      {method.description}
                    </p>
                  </VStack>
                </HStack>

                {/* Method Details */}
                {method.details && (
                  <div className="pl-12">
                    <VStack spacing="xs">
                      {method.details.cardNumber && (
                        <p className="text-sm text-gray-600">
                          {method.details.cardNumber} • Expires {method.details.expiryDate}
                        </p>
                      )}
                      {method.details.upiId && (
                        <p className="text-sm text-gray-600">
                          UPI ID: {method.details.upiId}
                        </p>
                      )}
                      {method.details.walletBalance && (
                        <p className="text-sm text-gray-600">
                          Balance: {formatCurrency(method.details.walletBalance)}
                        </p>
                      )}
                    </VStack>
                  </div>
                )}

                {/* Method Info */}
                <div className="pl-12">
                  <HStack spacing="md" align="center">
                    <HStack spacing="xs" align="center">
                      <span className="text-xs text-gray-500">Processing:</span>
                      <span className="text-xs font-medium text-green-600">
                        {method.estimatedTime}
                      </span>
                    </HStack>
                    
                    {method.processingFee && (
                      <HStack spacing="xs" align="center">
                        <span className="text-xs text-gray-500">Fee:</span>
                        <span className="text-xs font-medium text-orange-600">
                          {formatCurrency(method.processingFee)}
                        </span>
                      </HStack>
                    )}
                  </HStack>
                </div>

                {/* Total Amount for this method */}
                {method.processingFee && (
                  <div className="pl-12 pt-2 border-t border-gray-100">
                    <HStack justify="between" align="center">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(calculateTotal(method))}
                      </span>
                    </HStack>
                  </div>
                )}
              </VStack>
            </motion.div>
          </motion.div>
        ))}
      </VStack>

      {/* Add New Card Option */}
      {onAddCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: paymentMethods.length * 0.1 }}
        >
          <Button
            variant="outline"
            fullWidth
            onClick={onAddCard}
            leftIcon={<Plus className="w-4 h-4" />}
            className="border-dashed border-2 py-4"
          >
            Add New Card
          </Button>
        </motion.div>
      )}

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <HStack spacing="sm" align="center">
          <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </HStack>
      </motion.div>

      {/* Payment Logos */}
      <div className="flex justify-center items-center space-x-4 pt-2">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Secured by:</span>
          <div className="flex space-x-2">
            <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">SSL</div>
            <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">256-bit</div>
            <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">PCI DSS</div>
          </div>
        </div>
      </div>
    </VStack>
  );
};

export default PaymentMethods;
