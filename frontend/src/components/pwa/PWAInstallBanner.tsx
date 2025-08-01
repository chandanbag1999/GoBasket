import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  Zap, 
  Wifi,
  Bell,
  ShoppingBag
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { VStack, HStack } from '@/components/layout/Stack';

// Hooks
import { usePWA } from '@/hooks/usePWA';

/**
 * PWA Install Banner Component
 * 
 * Features:
 * - Smart install prompting
 * - Platform-specific instructions
 * - Benefits highlighting
 * - Dismissible with persistence
 * - Analytics tracking
 */
const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, installApp, dismissInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 7 days
    setIsDismissed(daysSinceDismissed < 7);
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      // Track successful installation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install_success', {
          event_category: 'PWA',
          event_label: 'Banner Install'
        });
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    dismissInstall();
    
    // Track dismissal
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_banner_dismissed', {
        event_category: 'PWA',
        event_label: 'Banner Dismissed'
      });
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Faster Loading',
      description: 'Lightning-fast app experience'
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Browse products without internet'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get order updates instantly'
    },
    {
      icon: ShoppingBag,
      title: 'Quick Access',
      description: 'One-tap shopping from home screen'
    }
  ];

  // Don't show if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-2xl">
          <VStack spacing="md">
            {/* Header */}
            <HStack justify="between" align="start">
              <HStack spacing="sm" align="center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <VStack spacing="xs">
                  <h3 className="font-bold text-white text-lg">
                    Install GoBasket
                  </h3>
                  <p className="text-primary-100 text-sm">
                    Get the full app experience
                  </p>
                </VStack>
              </HStack>
              
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDismiss}
                className="text-white/80 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </HStack>

            {/* Benefits Toggle */}
            <button
              onClick={() => setShowBenefits(!showBenefits)}
              className="text-left w-full"
            >
              <p className="text-primary-100 text-sm">
                {showBenefits ? 'Hide' : 'See'} app benefits →
              </p>
            </button>

            {/* Benefits List */}
            <AnimatePresence>
              {showBenefits && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                      >
                        <VStack spacing="xs">
                          <benefit.icon className="w-5 h-5 text-white" />
                          <span className="text-white font-medium text-xs">
                            {benefit.title}
                          </span>
                          <span className="text-primary-100 text-xs">
                            {benefit.description}
                          </span>
                        </VStack>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Install Button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleInstall}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white text-primary-600 hover:bg-gray-50 font-semibold"
            >
              Install App
            </Button>

            {/* Additional Info */}
            <p className="text-primary-100 text-xs text-center">
              Free • No app store required • Instant install
            </p>
          </VStack>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * PWA Update Banner Component
 * Shows when app update is available
 */
export const PWAUpdateBanner: React.FC = () => {
  const { isUpdateAvailable, updateApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpdate = () => {
    updateApp();
    
    // Track update
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_update_applied', {
        event_category: 'PWA',
        event_label: 'Update Banner'
      });
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isUpdateAvailable || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card variant="elevated" padding="md" className="bg-blue-500 text-white border-0">
          <HStack justify="between" align="center">
            <VStack spacing="xs" className="flex-1">
              <span className="font-semibold text-white">
                App Update Available
              </span>
              <span className="text-blue-100 text-sm">
                New features and improvements
              </span>
            </VStack>
            
            <HStack spacing="sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white/80 hover:text-white"
              >
                Later
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUpdate}
                className="bg-white text-blue-600 hover:bg-gray-50"
              >
                Update
              </Button>
            </HStack>
          </HStack>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * PWA Status Indicator Component
 * Shows connection and install status
 */
export const PWAStatusIndicator: React.FC = () => {
  const { isOnline, isInstalled } = usePWA();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <HStack spacing="sm">
        {/* Online/Offline Indicator */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <HStack spacing="xs" align="center">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </HStack>
        </div>

        {/* Install Status */}
        {isInstalled && (
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            <HStack spacing="xs" align="center">
              <Smartphone className="w-3 h-3" />
              <span>Installed</span>
            </HStack>
          </div>
        )}
      </HStack>
    </div>
  );
};

export default PWAInstallBanner;
