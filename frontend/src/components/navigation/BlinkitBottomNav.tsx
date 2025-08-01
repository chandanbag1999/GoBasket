import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  User,
  Grid3X3
} from 'lucide-react';

// Hooks
import { useCart } from '@/hooks';

/**
 * Professional Blinkit-Style Bottom Navigation
 * 
 * Features:
 * - Clean minimal design
 * - Active state indicators
 * - Cart badge
 * - Smooth animations
 * - Mobile optimized
 */
const BlinkitBottomNav: React.FC = () => {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/home',
      color: 'text-gray-900'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Grid3X3,
      path: '/categories',
      color: 'text-gray-900'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: '/search',
      color: 'text-gray-900'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      path: '/cart',
      color: 'text-gray-900',
      badge: itemCount
    },
    {
      id: 'profile',
      label: 'Account',
      icon: User,
      path: '/profile',
      color: 'text-gray-900'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-2 min-w-[60px]"
            >
              {/* Icon Container */}
              <div className="relative">
                <div className={`p-1 transition-colors ${
                  active
                    ? item.color
                    : 'text-gray-400'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-xs mt-0.5 font-normal transition-colors ${
                active
                  ? item.color
                  : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BlinkitBottomNav;
