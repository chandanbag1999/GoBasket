import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X
} from 'lucide-react';

// Components
import { Button } from '@/components/ui';
import Container from '@/components/layout/Container';

// Hooks
import { useCart } from '@/hooks';
import { useAuth } from '@/hooks';

/**
 * Professional Blinkit-Style Header
 * 
 * Features:
 * - Clean minimal design
 * - Location display
 * - Search functionality
 * - Cart with item count
 * - User menu
 * - Mobile responsive
 */
const BlinkitHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items, itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/auth/login');
    }
  };



  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-yellow-400 rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-sm">b</span>
            </div>
            <span className="text-lg font-bold text-gray-900">blinkit</span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={'Search "milk"'}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <button
              onClick={handleCartClick}
              className="relative flex items-center justify-center w-9 h-9 text-gray-700"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <button
              onClick={handleProfileClick}
              className="flex items-center justify-center w-9 h-9 text-gray-700"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={'Search "milk"'}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-3">
            {/* Menu Items */}
            <Link
              to="/categories"
              className="block py-2 text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              to="/offers"
              className="block py-2 text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Offers
            </Link>
            <Link
              to="/help"
              className="block py-2 text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Help & Support
            </Link>

            {/* Auth Actions */}
            {!isAuthenticated && (
              <div className="pt-3 border-t border-gray-100">
                <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2">
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}


    </header>
  );
};

export default BlinkitHeader;
