import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  MapPin,
  Bell
} from 'lucide-react';

// Components
import { Button, Badge, Avatar } from '@/components/ui';
import Container from './Container';

// Hooks
import { useAuth, useCart, useMediaQuery } from '@/hooks';

// Constants
import { ROUTES } from '@/constants';

/**
 * Header Component
 * 
 * Features:
 * - Logo and branding
 * - Search functionality
 * - Location selector
 * - Cart with item count
 * - User menu
 * - Mobile hamburger menu
 * - Notifications
 * - Responsive design
 */
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, itemCount } = useCart();

  /**
   * Handle search submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  /**
   * Handle mobile menu toggle
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Navigation items for mobile menu
   */
  const navigationItems = [
    { name: 'Home', href: ROUTES.HOME, icon: '🏠' },
    { name: 'Categories', href: ROUTES.PRODUCTS, icon: '📂' },
    { name: 'Offers', href: '/offers', icon: '🎁' },
    { name: 'About', href: ROUTES.ABOUT, icon: 'ℹ️' },
    { name: 'Contact', href: ROUTES.CONTACT, icon: '📞' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          )}

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-primary-500 text-white rounded-lg p-2">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <span className="text-xl font-display font-bold text-gray-900 hidden sm:block">
              GoBasket
            </span>
          </Link>

          {/* Location Selector - Desktop */}
          {!isMobile && (
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <MapPin className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs text-gray-500">Deliver to</div>
                <div className="font-medium">Mumbai 400001</div>
              </div>
            </Button>
          )}

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            {/* Search Button - Mobile */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/search')}
                className="p-2"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <Badge
                  variant="error"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs"
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.CART)}
              className="p-2 relative"
              aria-label={`Cart (${itemCount} items)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="primary"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={() => navigate(ROUTES.PROFILE)}
                >
                  <Avatar
                    src={typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.secure_url}
                    alt={user?.name}
                    size="sm"
                    fallback={user?.name?.charAt(0) || 'U'}
                  />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="hidden sm:flex"
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobile && (
          <div className="pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        )}
      </Container>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  {isAuthenticated ? (
                    <>
                      <Avatar
                        src={typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.secure_url}
                        alt={user?.name}
                        size="md"
                        fallback={user?.name?.charAt(0) || 'U'}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{user?.name}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">Menu</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="py-4">
                {/* Location Selector */}
                <div className="px-4 py-3 border-b">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                  >
                    <MapPin className="h-4 w-4 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Deliver to</div>
                      <div className="font-medium">Mumbai 400001</div>
                    </div>
                  </Button>
                </div>

                {/* Navigation Items */}
                <nav className="px-2 py-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={toggleMobileMenu}
                      className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
                        location.pathname === item.href ? 'bg-primary-50 text-primary-600' : ''
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Auth Actions */}
                <div className="px-4 py-4 border-t mt-4">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        to={ROUTES.PROFILE}
                        onClick={toggleMobileMenu}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        My Account
                      </Link>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => {
                          logout();
                          toggleMobileMenu();
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        fullWidth
                        onClick={() => {
                          navigate(ROUTES.LOGIN);
                          toggleMobileMenu();
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => {
                          navigate(ROUTES.REGISTER);
                          toggleMobileMenu();
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
