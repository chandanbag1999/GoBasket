import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Check } from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { VStack, HStack } from '@/components/layout/Stack';

// Utils
import { formatCurrency } from '@/lib/utils';

/**
 * Variant Option Interface
 */
interface VariantOption {
  id: string;
  label: string;
  value: string;
  price?: number; // Additional price
  originalPrice?: number;
  inStock: boolean;
  image?: string;
  color?: string; // For color variants
}

/**
 * Variant Group Interface
 */
interface VariantGroup {
  id: string;
  name: string;
  type: 'size' | 'color' | 'weight' | 'pack' | 'flavor';
  required: boolean;
  options: VariantOption[];
}

/**
 * Product Variants Props
 */
interface ProductVariantsProps {
  variants: VariantGroup[];
  basePrice: number;
  maxQuantity?: number;
  onVariantChange?: (variantGroupId: string, optionId: string) => void;
  onQuantityChange?: (quantity: number) => void;
  selectedVariants?: { [groupId: string]: string };
  quantity?: number;
}

/**
 * Professional Product Variants Selector
 * 
 * Features:
 * - Size, color, weight selection
 * - Price updates based on variants
 * - Stock status for each variant
 * - Quantity selector with limits
 * - Visual feedback for selections
 * - Mobile-optimized interface
 * 
 * Usage:
 * <ProductVariants 
 *   variants={variantGroups}
 *   basePrice={120}
 *   onVariantChange={handleVariantChange}
 *   onQuantityChange={handleQuantityChange}
 * />
 */
const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  basePrice,
  maxQuantity = 10,
  onVariantChange,
  onQuantityChange,
  selectedVariants = {},
  quantity = 1,
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const handleVariantSelect = (groupId: string, optionId: string) => {
    onVariantChange?.(groupId, optionId);
  };

  const handleQuantityUpdate = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setLocalQuantity(newQuantity);
      onQuantityChange?.(newQuantity);
    }
  };

  const calculateTotalPrice = () => {
    let totalPrice = basePrice;
    
    variants.forEach(group => {
      const selectedOptionId = selectedVariants[group.id];
      if (selectedOptionId) {
        const selectedOption = group.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption?.price) {
          totalPrice += selectedOption.price;
        }
      }
    });
    
    return totalPrice;
  };

  const renderVariantGroup = (group: VariantGroup) => {
    const selectedOptionId = selectedVariants[group.id];

    switch (group.type) {
      case 'color':
        return (
          <VStack spacing="sm">
            <h4 className="font-medium text-gray-900">
              {group.name}
              {group.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <motion.button
                  key={option.id}
                  className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    selectedOptionId === option.id
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${!option.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: option.color }}
                  onClick={() => option.inStock && handleVariantSelect(group.id, option.id)}
                  whileTap={{ scale: 0.95 }}
                  disabled={!option.inStock}
                >
                  {selectedOptionId === option.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {!option.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-0.5 bg-gray-500 rotate-45" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            {selectedOptionId && (
              <p className="text-sm text-gray-600">
                Selected: {group.options.find(opt => opt.id === selectedOptionId)?.label}
              </p>
            )}
          </VStack>
        );

      case 'size':
      case 'weight':
      case 'pack':
      case 'flavor':
        return (
          <VStack spacing="sm">
            <h4 className="font-medium text-gray-900">
              {group.name}
              {group.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {group.options.map((option) => (
                <motion.button
                  key={option.id}
                  className={`relative p-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedOptionId === option.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } ${!option.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => option.inStock && handleVariantSelect(group.id, option.id)}
                  whileTap={{ scale: 0.98 }}
                  disabled={!option.inStock}
                >
                  <VStack spacing="xs" align="center">
                    <span>{option.label}</span>
                    {option.price && option.price !== 0 && (
                      <span className="text-xs text-gray-500">
                        {option.price > 0 ? '+' : ''}{formatCurrency(option.price)}
                      </span>
                    )}
                    {!option.inStock && (
                      <Badge variant="error" size="sm" className="absolute -top-1 -right-1">
                        Out
                      </Badge>
                    )}
                  </VStack>
                  
                  {selectedOptionId === option.id && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <VStack spacing="lg">
      {/* Variant Groups */}
      {variants.map((group) => (
        <div key={group.id}>
          {renderVariantGroup(group)}
        </div>
      ))}

      {/* Quantity Selector */}
      <VStack spacing="sm">
        <h4 className="font-medium text-gray-900">Quantity</h4>
        <HStack spacing="md" align="center">
          <HStack spacing="sm" align="center" className="border border-gray-300 rounded-lg">
            <motion.button
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-50"
              onClick={() => handleQuantityUpdate(localQuantity - 1)}
              disabled={localQuantity <= 1}
              whileTap={{ scale: 0.95 }}
            >
              <Minus className="w-4 h-4" />
            </motion.button>
            
            <div className="w-16 text-center">
              <input
                type="number"
                value={localQuantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  handleQuantityUpdate(value);
                }}
                className="w-full text-center border-none outline-none text-lg font-semibold"
                min={1}
                max={maxQuantity}
              />
            </div>
            
            <motion.button
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-50"
              onClick={() => handleQuantityUpdate(localQuantity + 1)}
              disabled={localQuantity >= maxQuantity}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </HStack>

          <VStack spacing="xs">
            <span className="text-sm text-gray-600">
              Max: {maxQuantity}
            </span>
            {localQuantity > 1 && (
              <span className="text-xs text-gray-500">
                {formatCurrency(calculateTotalPrice())} each
              </span>
            )}
          </VStack>
        </HStack>
      </VStack>

      {/* Price Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <HStack justify="between" align="center">
          <span className="font-medium text-gray-900">Total Price:</span>
          <VStack spacing="xs" align="end">
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(calculateTotalPrice() * localQuantity)}
            </span>
            {localQuantity > 1 && (
              <span className="text-sm text-gray-600">
                {formatCurrency(calculateTotalPrice())} × {localQuantity}
              </span>
            )}
          </VStack>
        </HStack>
      </div>
    </VStack>
  );
};

export default ProductVariants;
