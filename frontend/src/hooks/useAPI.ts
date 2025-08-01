/**
 * API Integration Hooks
 * React Query hooks for API integration with real backend
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// API Services
import { 
  authAPI, 
  productsAPI, 
  cartAPI, 
  ordersAPI, 
  addressAPI,
  ApiResponse,
  PaginatedResponse 
} from '@/services/api';

// Analytics
import { analyticsService } from '@/services/analytics';

// Types
interface UseProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

// Query Keys
export const queryKeys = {
  auth: ['auth'] as const,
  profile: ['auth', 'profile'] as const,
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  categories: ['products', 'categories'] as const,
  featuredProducts: ['products', 'featured'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  addresses: ['addresses'] as const,
};

// Auth Hooks
export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { user, token } = response.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      queryClient.setQueryData(queryKeys.profile, user);
      
      // Track login
      analyticsService.trackEvent({
        action: 'login',
        category: 'auth',
        label: 'successful',
      });
      
      toast.success('Login successful!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
      analyticsService.trackError(error, 'login');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      toast.success('Registration successful! Please verify your email.');
      analyticsService.trackEvent({
        action: 'register',
        category: 'auth',
        label: 'successful',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
      analyticsService.trackError(error, 'register');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      queryClient.clear();
      toast.success('Logged out successfully');
    },
  });

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: authAPI.getProfile,
    enabled: !!localStorage.getItem('auth_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    profile: profileQuery.data?.data,
    isLoading: loginMutation.isPending || registerMutation.isPending || profileQuery.isLoading,
    isAuthenticated: !!profileQuery.data?.data,
  };
};

// Products Hooks
export const useProducts = (params: UseProductsParams = {}) => {
  return useQuery({
    queryKey: [...queryKeys.products, params],
    queryFn: () => productsAPI.getProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.data,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => productsAPI.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: productsAPI.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.data,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: queryKeys.featuredProducts,
    queryFn: productsAPI.getFeaturedProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

export const useProductSearch = (query: string, filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.products, 'search', query, filters],
    queryFn: () => productsAPI.searchProducts(query, filters),
    enabled: !!query && query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data.data,
  });
};

// Cart Hooks
export const useCart = () => {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartAPI.getCart,
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity, variantId }: { 
      productId: string; 
      quantity: number; 
      variantId?: string; 
    }) => cartAPI.addToCart(productId, quantity, variantId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      
      // Track add to cart
      analyticsService.trackAddToCart({
        item_id: variables.productId,
        item_name: 'Product', // Would get from product data
        category: 'unknown',
        quantity: variables.quantity,
        price: 0, // Would get from product data
      }, 0);
      
      toast.success('Added to cart!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartAPI.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update cart');
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: cartAPI.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      toast.success('Removed from cart');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove from cart');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartAPI.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      toast.success('Cart cleared');
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: cartAPI.applyCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      toast.success('Coupon applied!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid coupon');
    },
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    addToCart: addToCartMutation.mutate,
    updateCart: updateCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    applyCoupon: applyCouponMutation.mutate,
    isUpdating: addToCartMutation.isPending || updateCartMutation.isPending,
  };
};

// Orders Hooks
export const useOrders = (params: UseOrdersParams = {}) => {
  return useQuery({
    queryKey: [...queryKeys.orders, params],
    queryFn: () => ordersAPI.getOrders(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    select: (data) => data.data,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersAPI.getOrder(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersAPI.createOrder,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      
      // Track purchase
      analyticsService.trackPurchase({
        transaction_id: response.data.id,
        value: response.data.total,
        currency: 'INR',
        items: response.data.items || [],
      });
      
      toast.success('Order placed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order');
      analyticsService.trackError(error, 'create_order');
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ordersAPI.cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });
};

// Address Hooks
export const useAddresses = () => {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: addressAPI.getAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressAPI.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      toast.success('Address added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add address');
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      addressAPI.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      toast.success('Address updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update address');
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressAPI.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      toast.success('Address deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });
};

// Real-time updates hook
export const useRealTimeUpdates = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:5000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'ORDER_UPDATE':
          queryClient.invalidateQueries({ queryKey: queryKeys.orders });
          queryClient.invalidateQueries({ queryKey: queryKeys.order(data.orderId) });
          break;
        case 'CART_UPDATE':
          queryClient.invalidateQueries({ queryKey: queryKeys.cart });
          break;
        case 'PRODUCT_UPDATE':
          queryClient.invalidateQueries({ queryKey: queryKeys.products });
          break;
        default:
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);
};

export default {
  useAuth,
  useProducts,
  useProduct,
  useCategories,
  useFeaturedProducts,
  useProductSearch,
  useCart,
  useOrders,
  useOrder,
  useCreateOrder,
  useCancelOrder,
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useRealTimeUpdates,
};
