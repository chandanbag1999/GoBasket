import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Heart,
  User,
  Grid3X3,
  Package
} from 'lucide-react';

// Components
import Badge from '@/components/ui/Badge';

// Hooks
import { useAuth, useCart } from '@/hooks';

/**
 * Bottom Navigation Item Interface
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  path: string;
  badge?: number;
  requiresAuth?: boolean;
}

/**
 * Bottom Navigation Component Props
 */
interface BottomNavigationProps {
  variant?: 'default' | 'minimal';
  showLabels?: boolean;
}

/**
 * Professional Bottom Navigation - Mobile-First Design
 * 
 * Features:
 * - Touch-optimized navigation items
 * - Active state indicators
 * - Badge support for notifications
 * - Smooth animations
 * - Safe area support
 * - Authentication-aware
 * - Haptic feedback simulation
 * 
 * Usage:
 * <BottomNavigation showLabels />
 */
const BottomNavigation: React.FC<BottomNavigationProps> = ({
  variant = 'default',
  showLabels = true,
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      activeIcon: <Home className="w-5 h-5 fill-current" />,
      path: '/',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Grid3X3 className="w-5 h-5" />,
      activeIcon: <Grid3X3 className="w-5 h-5 fill-current" />,
      path: '/categories',
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5" />,
      activeIcon: <Search className="w-5 h-5 fill-current" />,
      path: '/search',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: <ShoppingCart className="w-5 h-5" />,
      activeIcon: <ShoppingCart className="w-5 h-5 fill-current" />,
      path: '/cart',
      badge: totalItems,
    },
    {
      id: 'profile',
      label: isAuthenticated ? 'Profile' : 'Login',
      icon: <User className="w-5 h-5" />,
      activeIcon: <User className="w-5 h-5 fill-current" />,
      path: isAuthenticated ? '/profile' : '/auth/login',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleItemClick = () => {
    // Simulate haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <motion.nav
      className="app-bottom-nav bg-white border-t border-gray-200 shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={handleItemClick}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 relative touch-manipulation"
            >
              <motion.div
                className="relative flex flex-col items-center justify-center"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {/* Icon Container */}
                <div className="relative">
                  <motion.div
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-primary-100 text-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    animate={{
                      scale: active ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {active ? (item.activeIcon || item.icon) : item.icon}
                  </motion.div>

                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge 
                        variant="primary" 
                        size="sm"
                        className="min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-xs font-bold"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                {showLabels && (
                  <motion.span
                    className={`text-xs font-medium mt-1 transition-all duration-200 ${
                      active 
                        ? 'text-primary-600' 
                        : 'text-gray-500'
                    }`}
                    animate={{
                      opacity: active ? 1 : 0.8,
                      y: active ? 0 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Active Indicator */}
                {active && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 bg-primary-500 rounded-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

/**
 * Floating Action Button Component
 * For quick actions like adding items to cart
 */
interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <ShoppingCart className="w-6 h-6" />,
  label = "Quick Add",
  variant = 'primary',
}) => {
  return (
    <motion.button
      className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
        variant === 'primary' 
          ? 'bg-primary-500 text-white hover:bg-primary-600' 
          : 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50'
      }`}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {icon}
    </motion.button>
  );
};

export default BottomNavigation;
