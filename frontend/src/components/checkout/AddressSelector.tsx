import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Briefcase, 
  MapPinIcon,
  Check,
  X
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { VStack, HStack } from '@/components/layout/Stack';

/**
 * Address Interface
 */
interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

/**
 * Address Selector Component Props
 */
interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onAddressSelect?: (addressId: string) => void;
  onAddAddress?: () => void;
  onEditAddress?: (address: Address) => void;
  onDeleteAddress?: (addressId: string) => void;
  showAddButton?: boolean;
}

/**
 * Professional Address Selector - Checkout Component
 * 
 * Features:
 * - Beautiful address cards with type indicators
 * - Add, edit, delete address functionality
 * - Default address selection
 * - Mobile-optimized layout
 * - Smooth animations
 * - Address validation
 * 
 * Usage:
 * <AddressSelector 
 *   addresses={userAddresses}
 *   selectedAddressId={selectedId}
 *   onAddressSelect={handleSelect}
 *   onAddAddress={handleAdd}
 * />
 */
const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  showAddButton = true,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <MapPinIcon className="w-4 h-4" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'home': return 'text-blue-600 bg-blue-50';
      case 'work': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const handleDeleteConfirm = (addressId: string) => {
    onDeleteAddress?.(addressId);
    setShowDeleteConfirm(null);
  };

  return (
    <VStack spacing="md">
      {/* Header */}
      <HStack justify="between" align="center">
        <h3 className="text-lg font-semibold text-gray-900">
          Delivery Address
        </h3>
        {showAddButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAddress}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New
          </Button>
        )}
      </HStack>

      {/* Address List */}
      <VStack spacing="sm">
        <AnimatePresence>
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <motion.div
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => onAddressSelect?.(address.id)}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection Indicator */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAddressId === address.id && (
                    <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                  )}
                </div>

                <VStack spacing="sm">
                  {/* Address Header */}
                  <HStack spacing="sm" align="center">
                    <div className={`p-2 rounded-lg ${getAddressTypeColor(address.type)}`}>
                      {getAddressTypeIcon(address.type)}
                    </div>
                    
                    <VStack spacing="xs" className="flex-1">
                      <HStack spacing="sm" align="center">
                        <span className="font-semibold text-gray-900 capitalize">
                          {address.type}
                        </span>
                        {address.isDefault && (
                          <Badge variant="primary" size="sm">
                            Default
                          </Badge>
                        )}
                      </HStack>
                      <span className="text-sm font-medium text-gray-700">
                        {address.name}
                      </span>
                    </VStack>
                  </HStack>

                  {/* Address Details */}
                  <div className="pl-12">
                    <VStack spacing="xs">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {formatAddress(address)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {address.phone}
                      </p>
                    </VStack>
                  </div>

                  {/* Address Actions */}
                  <div className="pl-12">
                    <HStack spacing="sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAddress?.(address);
                        }}
                        leftIcon={<Edit className="w-3 h-3" />}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Button>
                      
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(address.id);
                          }}
                          leftIcon={<Trash2 className="w-3 h-3" />}
                          className="text-red-500 hover:text-red-600"
                        >
                          Delete
                        </Button>
                      )}
                    </HStack>
                  </div>
                </VStack>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </VStack>

      {/* Empty State */}
      {addresses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <VStack spacing="sm">
            <h4 className="font-semibold text-gray-900">No addresses found</h4>
            <p className="text-gray-600 text-sm">
              Add a delivery address to continue
            </p>
            {showAddButton && (
              <Button
                variant="default"
                onClick={onAddAddress}
                leftIcon={<Plus className="w-4 h-4" />}
                className="mt-2"
              >
                Add Address
              </Button>
            )}
          </VStack>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <VStack spacing="md">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                
                <VStack spacing="sm" align="center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Address
                  </h3>
                  <p className="text-gray-600 text-center">
                    Are you sure you want to delete this address? This action cannot be undone.
                  </p>
                </VStack>

                <HStack spacing="sm" className="w-full">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    fullWidth
                    onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </HStack>
              </VStack>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </VStack>
  );
};

export default AddressSelector;
