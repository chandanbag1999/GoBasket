import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Grid3X3,
  ShoppingCart,
  User
} from 'lucide-react';

// Components
import { Badge } from '@/components/ui';

// Hooks
import { useAuth, useCart } from '@/hooks';

// Constants
import { ROUTES } from '@/constants';

/**
 * Bottom Navigation Component for Mobile
 * 
 * Features:
 * - 5 main navigation items
 * - Cart badge with item count
 * - Active state indicators
 * - Smooth animations
 * - Touch-friendly design
 */
const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  /**
   * Navigation items configuration
   */
  const navigationItems = [
    {
      name: 'Home',
      href: ROUTES.HOME,
      icon: Home,
      activeIcon: Home,
    },
    {
      name: 'Categories',
      href: ROUTES.CATEGORIES,
      icon: Grid3X3,
      activeIcon: Grid3X3,
    },
    {
      name: 'Search',
      href: ROUTES.SEARCH,
      icon: Search,
      activeIcon: Search,
    },
    {
      name: 'Cart',
      href: ROUTES.CART,
      icon: ShoppingCart,
      activeIcon: ShoppingCart,
      badge: itemCount,
    },
    {
      name: 'Profile',
      href: isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN,
      icon: User,
      activeIcon: User,
    },
  ];

  /**
   * Check if route is active
   */
  const isActiveRoute = (href: string) => {
    if (href === ROUTES.HOME) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          const IconComponent = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 relative"
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}

              {/* Icon Container */}
              <div className="relative mb-1">
                <IconComponent
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-primary-500' : 'text-gray-400'
                  }`}
                />
                
                {/* Badge for Cart */}
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="primary"
                    className="absolute -top-2 -right-2 min-w-[16px] h-4 text-xs"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-primary-500' : 'text-gray-500'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
