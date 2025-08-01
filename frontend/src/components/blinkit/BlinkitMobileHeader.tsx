import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  ShoppingBag,
  User,
  Menu
} from 'lucide-react';

interface BlinkitMobileHeaderProps {
  cartItemCount?: number;
  userLocation?: string;
  onLocationClick?: () => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onSearchFocus?: () => void;
}

/**
 * Blinkit Mobile Header - Exact Replica
 * Pixel-perfect copy of Blinkit's mobile app header
 */
const BlinkitMobileHeader: React.FC<BlinkitMobileHeaderProps> = ({
  cartItemCount = 0,
  userLocation = "Select Location",
  onLocationClick,
  onCartClick,
  onProfileClick,
  onSearchFocus
}) => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="blinkit-header bg-white shadow-sm">
      <div className="flex flex-col">
        {/* Top Header Row */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo & Location Section */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Blinkit Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">blinkit</span>
            </div>

            {/* Location */}
            <button
              onClick={onLocationClick}
              className="flex items-center space-x-1 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="flex items-center space-x-1 min-w-0">
                <span className="text-xs text-gray-500 font-medium">Delivery in</span>
                <span className="text-sm font-semibold text-gray-900 truncate max-w-24">
                  {userLocation}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Profile */}
            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={onSearchFocus}
              placeholder="Search for atta dal and more"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlinkitMobileHeader;
