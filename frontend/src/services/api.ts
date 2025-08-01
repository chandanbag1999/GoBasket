/**
 * API Service Layer
 * Centralized API communication with error handling, caching, and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { mockAPIService } from './mockAPI';

// Types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

class ApiService {
  private client: AxiosInstance;
  private retryQueue: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Timestamp'] = new Date().toISOString();

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle retry logic
        if (this.shouldRetry(error) && !originalRequest._retry) {
          return this.retryRequest(originalRequest);
        }

        console.error('[API] Response error:', error);
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const requestKey = `${config.method}_${config.url}`;
    const currentAttempts = this.retryQueue.get(requestKey) || 0;

    if (currentAttempts >= API_CONFIG.retryAttempts) {
      this.retryQueue.delete(requestKey);
      throw new Error('Max retry attempts exceeded');
    }

    this.retryQueue.set(requestKey, currentAttempts + 1);
    
    // Exponential backoff
    const delay = API_CONFIG.retryDelay * Math.pow(2, currentAttempts);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const response = await this.client(config);
      this.retryQueue.delete(requestKey);
      return response;
    } catch (error) {
      if (currentAttempts + 1 >= API_CONFIG.retryAttempts) {
        this.retryQueue.delete(requestKey);
      }
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
  }

  private handleAuthError(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Server error occurred',
        code: error.response.data?.code || `HTTP_${error.response.status}`,
        details: error.response.data?.details,
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Batch requests
  async batch<T>(requests: Array<() => Promise<any>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map(req => req()));
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Backend health endpoint is at root level, not under /api/v1
      await axios.get(`${API_CONFIG.baseURL.replace('/api/v1', '')}/health`);
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Specific API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.login(credentials);
    }
    return apiService.post('/auth/login', credentials);
  },

  register: (userData: { name: string; email: string; password: string; phone: string }) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.register(userData);
    }
    return apiService.post('/auth/register', userData);
  },

  logout: () =>
    apiService.post('/auth/logout'),

  forgotPassword: (email: string) =>
    apiService.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiService.post('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    apiService.post('/auth/verify-email', { token }),

  getProfile: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getProfile();
    }
    return apiService.get('/auth/me');
  },

  updateProfile: (data: any) =>
    apiService.put('/auth/profile', data),
};

export const productsAPI = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getProducts(params);
    }
    return apiService.get<PaginatedResponse<any>>('/products', { params });
  },

  getProduct: (id: string) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getProduct(id);
    }
    return apiService.get(`/products/${id}`);
  },

  getCategories: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getCategories();
    }
    return apiService.get('/categories');
  },

  getFeaturedProducts: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getFeaturedProducts();
    }
    return apiService.get('/products/featured');
  },

  searchProducts: (query: string, filters?: any) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.searchProducts(query);
    }
    return apiService.get('/products/search', { params: { q: query, ...filters } });
  },
};

export const cartAPI = {
  getCart: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getCart();
    }
    return apiService.get('/cart');
  },

  addToCart: (productId: string, quantity: number, variantId?: string) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.addToCart(productId, quantity);
    }
    return apiService.post('/cart/items', { productId, quantity, variantId });
  },

  updateCartItem: (itemId: string, quantity: number) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.updateCartItem(itemId, quantity);
    }
    return apiService.patch(`/cart/items/${itemId}`, { quantity });
  },

  removeFromCart: (itemId: string) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.removeFromCart(itemId);
    }
    return apiService.delete(`/cart/items/${itemId}`);
  },

  clearCart: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.clearCart();
    }
    return apiService.delete('/cart');
  },

  applyCoupon: (code: string) =>
    apiService.post('/cart/coupon', { code }),

  removeCoupon: () =>
    apiService.delete('/cart/coupon'),
};

export const ordersAPI = {
  createOrder: (orderData: any) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.createOrder(orderData);
    }
    return apiService.post('/orders', orderData);
  },

  getOrders: (params?: { page?: number; limit?: number; status?: string }) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getOrders(params);
    }
    return apiService.get<PaginatedResponse<any>>('/orders', { params });
  },

  getOrder: (id: string) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getOrder(id);
    }
    return apiService.get(`/orders/${id}`);
  },

  cancelOrder: (id: string, reason: string) =>
    apiService.patch(`/orders/${id}/cancel`, { reason }),

  trackOrder: (id: string) =>
    apiService.get(`/orders/${id}/tracking`),

  rateOrder: (id: string, rating: number, review?: string) =>
    apiService.post(`/orders/${id}/rating`, { rating, review }),
};

export const addressAPI = {
  getAddresses: () => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.getAddresses();
    }
    return apiService.get('/auth/addresses');
  },

  createAddress: (addressData: any) => {
    if (mockAPIService.shouldUseMock()) {
      return mockAPIService.createAddress(addressData);
    }
    return apiService.post('/auth/addresses', addressData);
  },

  updateAddress: (id: string, addressData: any) =>
    apiService.put(`/auth/addresses/${id}`, addressData),

  deleteAddress: (id: string) =>
    apiService.delete(`/auth/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    apiService.put(`/auth/addresses/${id}/default`),
};

export const paymentAPI = {
  // Razorpay order creation
  createOrder: (orderData: { amount: number; currency: string; receipt: string }) =>
    apiService.post('/payments/create-order', orderData),

  // Razorpay payment verification
  verifyPayment: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    apiService.post('/payments/verify', paymentData),

  // Get payment status
  getPaymentStatus: (paymentId: string) =>
    apiService.get(`/payments/status/${paymentId}`),

  // Refund payment
  refundPayment: (paymentId: string, amount?: number, reason?: string) =>
    apiService.post(`/payments/refund/${paymentId}`, { amount, reason }),

  // Get payment methods
  getPaymentMethods: () =>
    apiService.get('/payments/methods'),

  // Add payment method
  addPaymentMethod: (paymentMethodData: any) =>
    apiService.post('/payments/methods', paymentMethodData),

  // Delete payment method
  deletePaymentMethod: (id: string) =>
    apiService.delete(`/payments/methods/${id}`),
};

export default apiService;
