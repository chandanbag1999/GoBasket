import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Package, 
  Settings,
  Bell,
  Heart,
  Gift,
  HelpCircle,
  LogOut,
  Edit,
  ChevronRight,
  Star,
  Truck,
  Shield
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
import { useAuth, useCart } from '@/hooks';

// Utils
import { formatCurrency } from '@/lib/utils';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const profileStats = [
    { label: 'Orders', value: '24', icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Saved', value: '12', icon: Heart, color: 'text-red-600 bg-red-50' },
    { label: 'Rewards', value: '₹250', icon: Gift, color: 'text-green-600 bg-green-50' },
    { label: 'Rating', value: '4.8', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
  ];

  const menuItems = [
    { id: 'orders', label: 'My Orders', icon: Package, path: '/orders', badge: '3 Active' },
    { id: 'addresses', label: 'Addresses', icon: MapPin, path: '/addresses', badge: null },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard, path: '/payment-methods', badge: null },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist', badge: '12 items' },
    { id: 'rewards', label: 'Rewards & Offers', icon: Gift, path: '/rewards', badge: 'New' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', badge: null },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, path: '/help', badge: null },
  ];

  const recentOrders = [
    {
      id: 'ORD001',
      date: '2024-01-20',
      status: 'delivered',
      items: 5,
      total: 450,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop',
    },
    {
      id: 'ORD002',
      date: '2024-01-18',
      status: 'delivered',
      items: 3,
      total: 280,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} showLocation showCart showNotifications />

      <main className="pb-20">
        <Container size="7xl" padding="lg" className="pt-4">
          <VStack spacing="lg">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <VStack spacing="md">
                  <HStack spacing="md" align="center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <VStack spacing="xs" className="flex-1">
                      <h1 className="text-xl font-bold text-white">
                        {user?.name || 'John Doe'}
                      </h1>
                      <p className="text-primary-100">
                        {user?.email || 'john.doe@example.com'}
                      </p>
                      <p className="text-primary-100 text-sm">
                        Member since Jan 2024
                      </p>
                    </VStack>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/profile/edit')}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                  </HStack>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 pt-4">
                    {profileStats.map((stat) => (
                      <VStack key={stat.label} spacing="xs" align="center">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold text-white">{stat.value}</span>
                        <span className="text-xs text-primary-100">{stat.label}</span>
                      </VStack>
                    ))}
                  </div>
                </VStack>
              </Card>
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
                    <Button
                      variant="outline"
                      onClick={() => navigate('/orders')}
                      leftIcon={<Package className="w-4 h-4" />}
                      className="justify-start"
                    >
                      Track Orders
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/addresses')}
                      leftIcon={<MapPin className="w-4 h-4" />}
                      className="justify-start"
                    >
                      Add Address
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/rewards')}
                      leftIcon={<Gift className="w-4 h-4" />}
                      className="justify-start"
                    >
                      View Rewards
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/help')}
                      leftIcon={<HelpCircle className="w-4 h-4" />}
                      className="justify-start"
                    >
                      Get Help
                    </Button>
                  </div>
                </VStack>
              </Card>
            </motion.div>

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="md">
                  <HStack justify="between" align="center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <Link to="/orders">
                      <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                        View All
                      </Button>
                    </Link>
                  </HStack>

                  <VStack spacing="sm">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="p-3 border border-gray-200 rounded-lg">
                        <HStack spacing="sm" align="center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            <img src={order.image} alt="Order" className="w-full h-full object-cover" />
                          </div>
                          <VStack spacing="xs" className="flex-1">
                            <HStack justify="between" align="center">
                              <span className="font-semibold text-gray-900">#{order.id}</span>
                              <Badge variant="success" size="sm">
                                {order.status}
                              </Badge>
                            </HStack>
                            <HStack justify="between" align="center">
                              <span className="text-sm text-gray-600">
                                {order.items} items • {new Date(order.date).toLocaleDateString()}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(order.total)}
                              </span>
                            </HStack>
                          </VStack>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </HStack>
                      </div>
                    ))}
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Menu Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card variant="default" padding="lg">
                <VStack spacing="sm">
                  {menuItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <Link to={item.path} className="w-full">
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <HStack spacing="sm" align="center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <item.icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900">{item.label}</span>
                          </HStack>
                          <HStack spacing="sm" align="center">
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'New' ? 'primary' : 'secondary'} 
                                size="sm"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </HStack>
                        </div>
                      </Link>
                      {index < menuItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </VStack>
              </Card>
            </motion.div>

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowLogoutConfirm(true)}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Logout
              </Button>
            </motion.div>
          </VStack>
        </Container>
      </main>

      <BottomNavigation showLabels />

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full"
          >
            <VStack spacing="md">
              <h3 className="text-lg font-semibold text-gray-900">Logout</h3>
              <p className="text-gray-600 text-center">
                Are you sure you want to logout?
              </p>
              <HStack spacing="sm" className="w-full">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  fullWidth
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Logout
                </Button>
              </HStack>
            </VStack>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
