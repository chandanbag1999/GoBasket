import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Home, 
  Briefcase, 
  MapPin,
  Check,
  Star,
  Navigation
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

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

const AddressManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1',
      type: 'home',
      name: 'John Doe',
      phone: '+91 98765 43210',
      addressLine1: '123 MG Road',
      addressLine2: 'Near City Mall',
      landmark: 'Opposite Metro Station',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: true,
    },
    {
      id: 'addr-2',
      type: 'work',
      name: 'John Doe',
      phone: '+91 98765 43210',
      addressLine1: '456 Tech Park',
      addressLine2: 'Building A, Floor 5',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      isDefault: false,
    },
    {
      id: 'addr-3',
      type: 'other',
      name: 'Jane Doe',
      phone: '+91 98765 43211',
      addressLine1: '789 Residency Road',
      landmark: 'Near Coffee Shop',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      isDefault: false,
    },
  ]);

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
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

  const handleSetDefault = (addressId: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
  };

  const handleDelete = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    setShowDeleteConfirm(null);
  };

  const handleEdit = (address: Address) => {
    // In real app, this would navigate to edit form
    navigate(`/addresses/edit/${address.id}`, { state: { address } });
  };

  const handleAddNew = () => {
    navigate('/addresses/add');
  };

  const handleViewOnMap = (address: Address) => {
    const query = encodeURIComponent(formatAddress(address));
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} showLocation={false} showCart showNotifications />

      <main className="pb-20">
        <Container size="7xl" padding="lg" className="pt-4">
          <VStack spacing="lg">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HStack spacing="md" align="center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900 flex-1">
                  Manage Addresses
                </h1>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddNew}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add New
                </Button>
              </HStack>
            </motion.div>

            {/* Address List */}
            <VStack spacing="md">
              <AnimatePresence>
                {addresses.map((address, index) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card variant="default" padding="lg" hover>
                      <VStack spacing="md">
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
                                <Badge variant="primary" size="sm" leftIcon={<Star className="w-3 h-3" />}>
                                  Default
                                </Badge>
                              )}
                            </HStack>
                            <span className="text-sm font-medium text-gray-700">
                              {address.name}
                            </span>
                          </VStack>

                          {/* Action Buttons */}
                          <HStack spacing="sm">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(address)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            {!address.isDefault && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setShowDeleteConfirm(address.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </HStack>
                        </HStack>

                        {/* Address Details */}
                        <div className="pl-12">
                          <VStack spacing="sm">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {formatAddress(address)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Phone: {address.phone}
                            </p>
                          </VStack>
                        </div>

                        <Divider />

                        {/* Address Actions */}
                        <div className="grid grid-cols-2 gap-3">
                          {!address.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(address.id)}
                              leftIcon={<Check className="w-4 h-4" />}
                            >
                              Set as Default
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOnMap(address)}
                            leftIcon={<Navigation className="w-4 h-4" />}
                            className={address.isDefault ? 'col-span-2' : ''}
                          >
                            View on Map
                          </Button>
                        </div>
                      </VStack>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </VStack>

            {/* Add New Address Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: addresses.length * 0.1 }}
            >
              <Card 
                variant="outlined" 
                padding="lg" 
                hover 
                className="border-dashed border-2 border-gray-300 cursor-pointer"
                onClick={handleAddNew}
              >
                <VStack spacing="md" align="center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <VStack spacing="sm" align="center">
                    <h3 className="font-semibold text-gray-900">Add New Address</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Add a new delivery address for faster checkout
                    </p>
                  </VStack>
                </VStack>
              </Card>
            </motion.div>

            {/* Empty State */}
            {addresses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
                <VStack spacing="sm">
                  <h3 className="text-lg font-semibold text-gray-900">No addresses found</h3>
                  <p className="text-gray-600">
                    Add your first delivery address to get started
                  </p>
                  <Button
                    variant="default"
                    onClick={handleAddNew}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="mt-4"
                  >
                    Add Address
                  </Button>
                </VStack>
              </motion.div>
            )}
          </VStack>
        </Container>
      </main>

      <BottomNavigation showLabels />

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
                    onClick={() => handleDelete(showDeleteConfirm)}
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
    </div>
  );
};

export default AddressManagementPage;
