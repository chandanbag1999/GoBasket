import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Truck, 
  Clock, 
  Star, 
  Gift, 
  ArrowRight,
  CheckCircle,
  MapPin
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Container from '@/components/layout/Container';
import { VStack, HStack, Center } from '@/components/layout/Stack';

/**
 * Welcome Screen Component Props
 */
interface WelcomeScreenProps {
  userName?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Welcome Screen Component - Onboarding Experience
 * 
 * Features:
 * - Beautiful welcome animation
 * - Feature highlights carousel
 * - Location permission request
 * - Smooth transitions
 * - Mobile-optimized design
 * - Skip option for returning users
 */
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName = 'there',
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "10-Minute Delivery",
      description: "Get your groceries delivered in just 10 minutes",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Fresh & Quality",
      description: "Hand-picked fresh groceries from trusted vendors",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Best Prices",
      description: "Competitive prices with exclusive deals and offers",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleLocationPermission();
    }
  };

  const handleLocationPermission = async () => {
    try {
      const permission = await navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocationEnabled(true);
          setTimeout(() => {
            onComplete?.();
          }, 1500);
        },
        () => {
          // Location denied, but continue anyway
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        }
      );
    } catch (error) {
      // Continue without location
      onComplete?.();
    }
  };

  const currentFeature = features[currentStep];

  if (isLocationEnabled) {
    return (
      <Container size="sm" padding="lg" className="min-h-screen">
        <Center className="min-h-screen">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              All Set! 🎉
            </h1>
            <p className="text-gray-600">
              You're ready to start shopping
            </p>
          </motion.div>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" padding="lg" className="min-h-screen">
      <Center className="min-h-screen py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Skip Button */}
          <HStack justify="end" className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500"
            >
              Skip
            </Button>
          </HStack>

          {/* Welcome Header */}
          <VStack spacing="lg" className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <VStack spacing="sm">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {userName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Let's get you started with GoBasket
              </p>
            </VStack>
          </VStack>

          {/* Feature Card */}
          <Card variant="elevated" padding="lg" className="mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <VStack spacing="lg" align="center">
                  <div className={`w-16 h-16 ${currentFeature.bgColor} rounded-2xl flex items-center justify-center`}>
                    <div className={currentFeature.textColor}>
                      {currentFeature.icon}
                    </div>
                  </div>

                  <VStack spacing="sm" align="center">
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentFeature.title}
                    </h2>
                    <p className="text-gray-600 text-center">
                      {currentFeature.description}
                    </p>
                  </VStack>
                </VStack>
              </motion.div>
            </AnimatePresence>
          </Card>

          {/* Progress Indicators */}
          <HStack spacing="sm" justify="center" className="mb-8">
            {features.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-primary-500' 
                    : index < currentStep 
                      ? 'w-2 bg-primary-300' 
                      : 'w-2 bg-gray-200'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </HStack>

          {/* Action Buttons */}
          <VStack spacing="md">
            <Button
              variant="default"
              size="lg"
              fullWidth
              onClick={handleNext}
              rightIcon={
                currentStep === features.length - 1 ? (
                  <MapPin className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {currentStep === features.length - 1 
                ? 'Enable Location' 
                : 'Next'
              }
            </Button>

            {currentStep === features.length - 1 && (
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={onComplete}
                className="text-gray-600"
              >
                Maybe Later
              </Button>
            )}
          </VStack>

          {/* Feature Benefits */}
          <VStack spacing="sm" className="mt-8">
            <Center>
              <p className="text-xs text-gray-500 text-center">
                Join thousands of happy customers
              </p>
            </Center>
            <HStack spacing="lg" justify="center">
              <VStack spacing="xs" align="center">
                <Badge variant="success" size="sm">4.8★</Badge>
                <p className="text-xs text-gray-500">Rating</p>
              </VStack>
              <VStack spacing="xs" align="center">
                <Badge variant="primary" size="sm">50K+</Badge>
                <p className="text-xs text-gray-500">Orders</p>
              </VStack>
              <VStack spacing="xs" align="center">
                <Badge variant="secondary" size="sm">10min</Badge>
                <p className="text-xs text-gray-500">Delivery</p>
              </VStack>
            </HStack>
          </VStack>
        </motion.div>
      </Center>
    </Container>
  );
};

export default WelcomeScreen;
