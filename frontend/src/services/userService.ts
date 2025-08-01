import apiClient from './api';
import type { User, ApiResponse, UpdateProfileData } from '@/types';

// UpdateProfileData is now imported from @/types

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class UserService {
  private readonly baseUrl = '/users';

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`${this.baseUrl}/profile`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await apiClient.put<ApiResponse<{ user: User }>>(`${this.baseUrl}/profile`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(formData: FormData): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User }>>(`${this.baseUrl}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`${this.baseUrl}/avatar`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete avatar');
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    try {
      const response = await apiClient.put<ApiResponse>(`${this.baseUrl}/change-password`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/addresses`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }

  /**
   * Add new address
   */
  async addAddress(addressData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`${this.baseUrl}/addresses`, addressData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add address');
    }
  }

  /**
   * Update address
   */
  async updateAddress(addressId: string, addressData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`${this.baseUrl}/addresses/${addressId}`, addressData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update address');
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`${this.baseUrl}/addresses/${addressId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete address');
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/preferences`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`${this.baseUrl}/preferences`, preferences);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update preferences');
    }
  }

  /**
   * Get user order history
   */
  async getOrderHistory(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`${this.baseUrl}/orders`, { params });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order history');
    }
  }

  /**
   * Get user favorites
   */
  async getFavorites(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/favorites`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
    }
  }

  /**
   * Add product to favorites
   */
  async addToFavorites(productId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(`${this.baseUrl}/favorites`, { productId });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add to favorites');
    }
  }

  /**
   * Remove product from favorites
   */
  async removeFromFavorites(productId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`${this.baseUrl}/favorites/${productId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove from favorites');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete<ApiResponse>(`${this.baseUrl}/account`, {
        data: { password }
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  }

  /**
   * Request account data export
   */
  async requestDataExport(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(`${this.baseUrl}/export-data`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request data export');
    }
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
