import React, { useState } from 'react';
import { Plus, Minus, Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  unit: string;
  deliveryTime?: string;
  rating?: number;
  inStock?: boolean;
}

interface BlinkitProductCardProps {
  product: Product;
  quantity?: number;
  onAddToCart?: (productId: string) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onProductClick?: (product: Product) => void;
}

/**
 * Blinkit Product Card - Exact Replica
 * Pixel-perfect copy of Blinkit's product card design
 */
const BlinkitProductCard: React.FC<BlinkitProductCardProps> = ({
  product,
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onProductClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product.id);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onUpdateQuantity?.(product.id, quantity - 1);
    }
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={() => onProductClick?.(product)}
      className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      {/* Delivery Time Badge */}
      {product.deliveryTime && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1 z-10 shadow-sm">
          <Clock className="w-3 h-3" />
          <span>{product.deliveryTime}</span>
        </div>
      )}

      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Product Image */}
      <div className="relative mb-4">
        <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-xl" />
          )}
          {imageError ? (
            <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-gray-500 text-xl">📦</span>
                </div>
                <span className="text-xs text-gray-500">Image not available</span>
              </div>
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="absolute bottom-3 right-3">
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-10 h-10 bg-white border-2 border-green-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-green-50 hover:scale-110 transition-all duration-200"
            >
              <Plus className="w-5 h-5 text-green-600" />
            </button>
          ) : (
            <div className="flex items-center bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-green-800 transition-colors rounded-l-xl"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-white text-sm font-bold min-w-[40px] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-green-800 transition-colors rounded-r-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">
            {product.brand}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>

        {/* Unit */}
        <p className="text-xs text-gray-500 font-medium">
          {product.unit}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-xs font-medium text-gray-700 ml-1">{product.rating}</span>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status */}
        {product.inStock === false && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-red-500 font-medium">Out of stock</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlinkitProductCard;
