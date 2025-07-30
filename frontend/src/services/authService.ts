import { get, post } from './apiClient';
import { API_CONFIG } from '@/constants';
import type { ApiResponse, User, LoginFormData, RegisterFormData } from '@/types';

/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including:
 * - User login and registration
 * - Password reset functionality
 * - Email verification
 * - Token refresh
 */

/**
 * Login Response Interface
 */
interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register Response Interface
 */
interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Login user with email and password
   * @param credentials - Login form data
   * @returns Promise with login response
   */
  async login(credentials: LoginFormData): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await post<LoginResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Register new user
   * @param userData - Registration form data
   * @returns Promise with registration response
   */
  async register(userData: RegisterFormData): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await post<RegisterResponse>(
        API_CONFIG.ENDPOINTS.REGISTER,
        userData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  /**
   * Logout user
   * @returns Promise with logout response
   */
  async logout(): Promise<ApiResponse> {
    try {
      const response = await post(API_CONFIG.ENDPOINTS.LOGOUT);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Logout failed');
    }
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns Promise with new access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const response = await post<{ accessToken: string }>(
        API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
        { refreshToken }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Token refresh failed');
    }
  }

  /**
   * Send forgot password email
   * @param email - User email
   * @returns Promise with response
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await post(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send reset email');
    }
  }

  /**
   * Reset password with token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Promise with response
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await post(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password reset failed');
    }
  }

  /**
   * Verify email with token
   * @param token - Verification token
   * @returns Promise with response
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await post(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, { token });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Email verification failed');
    }
  }

  /**
   * Get current user profile
   * @returns Promise with user data
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await get<User>(API_CONFIG.ENDPOINTS.PROFILE);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user profile');
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
