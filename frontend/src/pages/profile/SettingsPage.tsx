import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  CreditCard,
  MapPin,
  Truck,
  ChevronRight,
  Toggle
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newProducts: false,
      priceDrops: true,
      deliveryUpdates: true,
    },
    preferences: {
      darkMode: false,
      language: 'en',
      currency: 'INR',
      deliveryInstructions: '',
    },
    privacy: {
      shareData: false,
      personalizedAds: true,
      locationTracking: true,
    }
  });

  const toggleSetting = (category: keyof typeof settings, key: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof typeof prev[typeof category]]
      }
    }));
  };

  const settingSections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          id: 'orderUpdates',
          label: 'Order Updates',
          description: 'Get notified about order status changes',
          type: 'toggle',
          value: settings.notifications.orderUpdates,
          category: 'notifications'
        },
        {
          id: 'promotions',
          label: 'Promotions & Offers',
          description: 'Receive notifications about deals and discounts',
          type: 'toggle',
          value: settings.notifications.promotions,
          category: 'notifications'
        },
        {
          id: 'newProducts',
          label: 'New Products',
          description: 'Be the first to know about new arrivals',
          type: 'toggle',
          value: settings.notifications.newProducts,
          category: 'notifications'
        },
        {
          id: 'priceDrops',
          label: 'Price Drops',
          description: 'Get alerted when prices drop on saved items',
          type: 'toggle',
          value: settings.notifications.priceDrops,
          category: 'notifications'
        },
        {
          id: 'deliveryUpdates',
          label: 'Delivery Updates',
          description: 'Real-time delivery tracking notifications',
          type: 'toggle',
          value: settings.notifications.deliveryUpdates,
          category: 'notifications'
        },
      ]
    },
    {
      title: 'App Preferences',
      icon: Smartphone,
      items: [
        {
          id: 'darkMode',
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          type: 'toggle',
          value: settings.preferences.darkMode,
          category: 'preferences'
        },
        {
          id: 'language',
          label: 'Language',
          description: 'English',
          type: 'navigation',
          path: '/settings/language'
        },
        {
          id: 'currency',
          label: 'Currency',
          description: 'Indian Rupee (₹)',
          type: 'navigation',
          path: '/settings/currency'
        },
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          id: 'shareData',
          label: 'Share Usage Data',
          description: 'Help improve the app by sharing anonymous usage data',
          type: 'toggle',
          value: settings.privacy.shareData,
          category: 'privacy'
        },
        {
          id: 'personalizedAds',
          label: 'Personalized Ads',
          description: 'Show ads based on your preferences',
          type: 'toggle',
          value: settings.privacy.personalizedAds,
          category: 'privacy'
        },
        {
          id: 'locationTracking',
          label: 'Location Services',
          description: 'Allow location access for better delivery experience',
          type: 'toggle',
          value: settings.privacy.locationTracking,
          category: 'privacy'
        },
      ]
    }
  ];

  const quickActions = [
    {
      id: 'account',
      label: 'Account Information',
      description: 'Manage your personal details',
      icon: Shield,
      path: '/profile/edit',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'addresses',
      label: 'Delivery Addresses',
      description: 'Manage your saved addresses',
      icon: MapPin,
      path: '/addresses',
      color: 'text-green-600 bg-green-50'
    },
    {
      id: 'payments',
      label: 'Payment Methods',
      description: 'Manage cards and payment options',
      icon: CreditCard,
      path: '/payment-methods',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'delivery',
      label: 'Delivery Preferences',
      description: 'Set delivery instructions and preferences',
      icon: Truck,
      path: '/settings/delivery',
      color: 'text-orange-600 bg-orange-50'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} showLocation={false} showCart showNotifications />

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
                <h1 className="text-xl font-semibold text-gray-900 flex-1">
                  Settings
                </h1>
              </HStack>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => navigate(action.path)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <VStack spacing="sm">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <VStack spacing="xs">
                            <span className="font-medium text-gray-900 text-sm">{action.label}</span>
                            <span className="text-xs text-gray-600">{action.description}</span>
                          </VStack>
                        </VStack>
                      </button>
                    ))}
                  </div>
                </VStack>
              </Card>
            </motion.div>

            {/* Settings Sections */}
            {settingSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + sectionIndex * 0.1 }}
              >
                <Card variant="default" padding="lg">
                  <VStack spacing="md">
                    <HStack spacing="sm" align="center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <section.icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    </HStack>

                    <VStack spacing="sm">
                      {section.items.map((item, itemIndex) => (
                        <React.Fragment key={item.id}>
                          <div className="flex items-center justify-between py-3">
                            <VStack spacing="xs" className="flex-1">
                              <span className="font-medium text-gray-900">{item.label}</span>
                              <span className="text-sm text-gray-600">{item.description}</span>
                            </VStack>

                            {item.type === 'toggle' && (
                              <button
                                onClick={() => toggleSetting(item.category as keyof typeof settings, item.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  item.value ? 'bg-primary-500' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    item.value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}

                            {item.type === 'navigation' && (
                              <button
                                onClick={() => navigate(item.path!)}
                                className="flex items-center space-x-2 text-gray-400 hover:text-gray-600"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {itemIndex < section.items.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              </motion.div>
            ))}

            {/* App Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card variant="outlined" padding="lg" className="border-gray-200 bg-gray-50">
                <VStack spacing="md">
                  <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
                  
                  <VStack spacing="sm">
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium text-gray-900">1.0.0</span>
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <span className="text-gray-600">Build</span>
                      <span className="font-medium text-gray-900">2024.01.20</span>
                    </HStack>
                    
                    <Divider />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/privacy-policy')}
                      >
                        Privacy Policy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/terms-of-service')}
                      >
                        Terms of Service
                      </Button>
                    </div>
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <h2 className="text-lg font-semibold text-gray-900">Support</h2>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/help')}
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                      className="justify-start"
                    >
                      Help Center
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = 'mailto:support@gobasket.com'}
                      leftIcon={<Mail className="w-4 h-4" />}
                      className="justify-start"
                    >
                      Contact Support
                    </Button>
                  </div>
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

export default SettingsPage;
