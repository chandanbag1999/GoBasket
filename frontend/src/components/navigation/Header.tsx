import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  Bell, 
  Menu,
  User,
  ChevronDown,
  Clock
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { HStack, VStack } from '@/components/layout/Stack';

// Hooks
import { useAuth, useCart } from '@/hooks';

/**
 * Header Component Props
 */
interface HeaderProps {
  showSearch?: boolean;
  showLocation?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  variant?: 'default' | 'minimal' | 'search-focused';
}

/**
 * Professional Header Component - Blinkit/BigBasket Style
 * 
 * Features:
 * - Location picker with delivery time
 * - Search bar with suggestions
 * - Cart with item count
 * - Notifications with badge
 * - User menu
 * - Mobile-optimized layout
 * - Sticky positioning
 * - Safe area support
 * 
 * Usage:
 * <Header 
 *   showSearch 
 *   showLocation 
 *   showCart 
 *   showNotifications 
 * />
 */
const Header: React.FC<HeaderProps> = ({
  showSearch = true,
  showLocation = true,
  showCart = true,
  showNotifications = true,
  variant = 'default',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, totalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentLocation = "Koramangala, Bangalore";
  const deliveryTime = "10 mins";

  return (
    <motion.header
      className="app-header bg-white border-b border-gray-200 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3">
        {/* Top Row - Location & User Actions */}
        <HStack justify="between" align="center" className="mb-3">
          {/* Location Picker */}
          {showLocation && (
            <motion.button
              className="flex items-center space-x-2 text-left flex-1 max-w-xs"
              onClick={() => setShowLocationModal(true)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {currentLocation}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {deliveryTime}
                  </span>
                </div>
              </div>
            </motion.button>
          )}

          {/* User Actions */}
          <HStack spacing="sm" align="center">
            {/* Notifications */}
            {showNotifications && (
              <motion.div className="relative" whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <Badge 
                    variant="error" 
                    size="sm"
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-xs font-bold"
                  >
                    3
                  </Badge>
                </Button>
              </motion.div>
            )}

            {/* Cart */}
            {showCart && (
              <motion.div className="relative" whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {totalItems > 0 && (
                    <Badge 
                      variant="primary" 
                      size="sm"
                      className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-xs font-bold"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </Button>
              </motion.div>
            ) : (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/auth/login')}
                >
                  <User className="w-5 h-5 text-gray-600" />
                </Button>
              </motion.div>
            )}
          </HStack>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <motion.form
            onSubmit={handleSearch}
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for groceries, fruits, vegetables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
              {searchQuery && (
                <motion.button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Search
                </motion.button>
              )}
            </div>
          </motion.form>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
