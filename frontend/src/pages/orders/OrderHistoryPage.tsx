import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Star,
  RotateCcw,
  MessageCircle,
  Filter,
  Search
} from 'lucide-react';

// Components
import Header from '@/components/navigation/Header';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Container from '@/components/layout/Container';
import { VStack, HStack, Divider } from '@/components/layout/Stack';

// Utils
import { formatCurrency } from '@/lib/utils';

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const orders = [
    {
      id: 'ORD001',
      date: '2024-01-20T10:30:00Z',
      status: 'delivered',
      items: [
        { name: 'Fresh Red Apples', quantity: 2, price: 120, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop' },
        { name: 'Organic Bananas', quantity: 1, price: 60, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop' },
      ],
      total: 450,
      deliveryAddress: '123 MG Road, Bangalore',
      estimatedDelivery: '2024-01-20T11:00:00Z',
      actualDelivery: '2024-01-20T10:55:00Z',
      rating: 5,
    },
    {
      id: 'ORD002',
      date: '2024-01-18T15:20:00Z',
      status: 'delivered',
      items: [
        { name: 'Fresh Oranges', quantity: 1, price: 80, image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=100&h=100&fit=crop' },
        { name: 'Green Vegetables', quantity: 2, price: 100, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop' },
      ],
      total: 280,
      deliveryAddress: '456 Tech Park, Bangalore',
      estimatedDelivery: '2024-01-18T16:00:00Z',
      actualDelivery: '2024-01-18T15:45:00Z',
      rating: 4,
    },
    {
      id: 'ORD003',
      date: '2024-01-15T09:15:00Z',
      status: 'processing',
      items: [
        { name: 'Dairy Products', quantity: 3, price: 200, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop' },
      ],
      total: 350,
      deliveryAddress: '789 Residency Road, Bangalore',
      estimatedDelivery: '2024-01-15T10:00:00Z',
    },
    {
      id: 'ORD004',
      date: '2024-01-10T14:30:00Z',
      status: 'cancelled',
      items: [
        { name: 'Snacks & Beverages', quantity: 4, price: 180, image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop' },
      ],
      total: 220,
      deliveryAddress: '123 MG Road, Bangalore',
      cancelReason: 'Items out of stock',
    },
  ];

  const filterOptions = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'active', label: 'Active', count: orders.filter(o => o.status === 'processing').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  My Orders
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600"
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </HStack>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Orders List */}
            <VStack spacing="md">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card variant="default" padding="lg" hover className="cursor-pointer">
                    <VStack spacing="md">
                      {/* Order Header */}
                      <HStack justify="between" align="center">
                        <VStack spacing="xs">
                          <span className="font-semibold text-gray-900">#{order.id}</span>
                          <span className="text-sm text-gray-600">
                            {formatDate(order.date)}
                          </span>
                        </VStack>
                        <div className={`px-3 py-1 rounded-full border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="text-sm font-medium capitalize">{order.status}</span>
                        </div>
                      </HStack>

                      {/* Order Items */}
                      <VStack spacing="sm">
                        {order.items.map((item, itemIndex) => (
                          <HStack key={itemIndex} spacing="sm" align="center">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <VStack spacing="xs" className="flex-1">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-sm text-gray-600">
                                Qty: {item.quantity} • {formatCurrency(item.price)}
                              </span>
                            </VStack>
                          </HStack>
                        ))}
                      </VStack>

                      <Divider />

                      {/* Order Details */}
                      <VStack spacing="sm">
                        <HStack justify="between" align="center">
                          <span className="text-gray-600">Total Amount</span>
                          <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                        </HStack>
                        
                        <HStack justify="between" align="start">
                          <span className="text-gray-600">Delivery Address</span>
                          <span className="text-sm text-gray-900 text-right max-w-[200px]">
                            {order.deliveryAddress}
                          </span>
                        </HStack>

                        {order.status === 'delivered' && order.actualDelivery && (
                          <HStack justify="between" align="center">
                            <span className="text-gray-600">Delivered At</span>
                            <span className="text-sm text-green-600 font-medium">
                              {formatDate(order.actualDelivery)}
                            </span>
                          </HStack>
                        )}

                        {order.status === 'processing' && order.estimatedDelivery && (
                          <HStack justify="between" align="center">
                            <span className="text-gray-600">Estimated Delivery</span>
                            <span className="text-sm text-blue-600 font-medium">
                              {formatDate(order.estimatedDelivery)}
                            </span>
                          </HStack>
                        )}

                        {order.status === 'cancelled' && order.cancelReason && (
                          <HStack justify="between" align="start">
                            <span className="text-gray-600">Cancel Reason</span>
                            <span className="text-sm text-red-600 text-right max-w-[200px]">
                              {order.cancelReason}
                            </span>
                          </HStack>
                        )}
                      </VStack>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        {order.status === 'delivered' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Star className="w-4 h-4" />}
                              onClick={() => navigate(`/orders/${order.id}/rate`)}
                            >
                              Rate Order
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RotateCcw className="w-4 h-4" />}
                              onClick={() => navigate(`/orders/${order.id}/reorder`)}
                            >
                              Reorder
                            </Button>
                          </>
                        )}
                        
                        {order.status === 'processing' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Truck className="w-4 h-4" />}
                              onClick={() => navigate(`/orders/${order.id}/track`)}
                            >
                              Track Order
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle className="w-4 h-4" />}
                              onClick={() => navigate(`/support?order=${order.id}`)}
                            >
                              Get Help
                            </Button>
                          </>
                        )}

                        {order.status === 'cancelled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<RotateCcw className="w-4 h-4" />}
                              onClick={() => navigate(`/orders/${order.id}/reorder`)}
                            >
                              Reorder
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle className="w-4 h-4" />}
                              onClick={() => navigate(`/support?order=${order.id}`)}
                            >
                              Get Help
                            </Button>
                          </>
                        )}
                      </div>
                    </VStack>
                  </Card>
                </motion.div>
              ))}
            </VStack>

            {/* Empty State */}
            {filteredOrders.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <VStack spacing="sm">
                  <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'Try adjusting your search' : 'Start shopping to see your orders here'}
                  </p>
                  <Button
                    variant="default"
                    onClick={() => navigate('/app')}
                    className="mt-4"
                  >
                    Start Shopping
                  </Button>
                </VStack>
              </motion.div>
            )}
          </VStack>
        </Container>
      </main>

      <BottomNavigation showLabels />
    </div>
  );
};

export default OrderHistoryPage;
