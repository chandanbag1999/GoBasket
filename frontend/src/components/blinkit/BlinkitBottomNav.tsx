import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  ShoppingBag,
  User,
  Grid3X3,
  Heart
} from 'lucide-react';
import { useAuth } from '@/hooks';

interface BlinkitBottomNavProps {
  activeTab?: string;
  cartItemCount?: number;
  onTabChange?: (tab: string) => void;
}

/**
 * Blinkit Bottom Navigation - Exact Replica
 * 5-tab bottom navigation matching Blinkit's mobile app
 */
const BlinkitBottomNav: React.FC<BlinkitBottomNavProps> = ({
  activeTab = 'home',
  cartItemCount = 0,
  onTabChange
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: '/search'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Grid3X3,
      path: '/categories'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      path: '/cart',
      badge: cartItemCount
    },
    {
      id: 'account',
      label: isAuthenticated ? 'Account' : 'Login',
      icon: User,
      path: isAuthenticated ? '/profile' : '/auth/login'
    }
  ];

  return (
    <div className="blinkit-bottom-nav bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.path) {
                  navigate(tab.path);
                }
                onTabChange?.(tab.id);
              }}
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 min-w-0 flex-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-green-50 scale-105'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full"></div>
                )}

                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                />

                {/* Cart Badge */}
                {tab.id === 'cart' && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>

              <span
                className={`text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BlinkitBottomNav;
