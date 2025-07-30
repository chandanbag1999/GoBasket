import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@/constants';
import { getStorageItem, removeStorageItem } from '@/utils';
import type { ApiResponse } from '@/types';

// API Client Configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically adds authentication token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = getStorageItem(STORAGE_KEYS.ACCESS_TOKEN, null);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common response scenarios and errors
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = getStorageItem(STORAGE_KEYS.REFRESH_TOKEN, null);
        
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
            refreshToken
          });

          if (response.data.success) {
            const { accessToken } = response.data.data;
            
            // Update stored token
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, clear tokens and redirect to login
      removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
      removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
      removeStorageItem(STORAGE_KEYS.USER_DATA);
      
      // Redirect to login page
      window.location.href = '/login';
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// API Client Methods
export const get = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.get(url, config);
};


export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.post(url, data, config);
};


export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.put(url, data, config);
};


export const patch = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.patch(url, data, config);
};


export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient.delete(url, config);
};


export const uploadFile = <T = any>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<AxiosResponse<ApiResponse<T>>> => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post(url, formData, {
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
};

/**
 * Cancel token source for request cancellation
 */
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

/**
 * Check if error is a cancel error
 */
export const isCancel = (error: any): boolean => {
  return axios.isCancel(error);
};

export default apiClient;
