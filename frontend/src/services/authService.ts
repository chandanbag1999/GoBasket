import apiService from './api';
import type { 
  LoginFormData, 
  RegisterFormData, 
  User,
  ApiResponse 
} from '@/types';

// Type aliases for compatibility
type LoginCredentials = LoginFormData;
type RegisterData = RegisterFormData;
type AuthResponse = ApiResponse<{ user: User; accessToken: string; refreshToken: string; }>;

class AuthService {
  private readonly baseUrl = '/auth';

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(`${this.baseUrl}/login`, credentials);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(`${this.baseUrl}/register`, userData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/logout`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get<ApiResponse<User>>(`${this.baseUrl}/profile`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put<ApiResponse<User>>(`${this.baseUrl}/profile`, userData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.put<ApiResponse>(`${this.baseUrl}/change-password`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/forgot-password`, { email });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  }

  /**
   * Forgot password (alias for requestPasswordReset)
   */
  async forgotPassword(data: { email: string }): Promise<ApiResponse> {
    return this.requestPasswordReset(data.email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/reset-password`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/verify-email`, { token });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  /**
   * Resend email verification
   */
  async resendVerification(): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/resend-verification`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: { phone: string; otp: string }): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(`${this.baseUrl}/verify-otp`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(data: { phone: string }): Promise<ApiResponse> {
    try {
      const response = await apiService.post<ApiResponse>(`${this.baseUrl}/resend-otp`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(`${this.baseUrl}/refresh-token`, {
        refreshToken
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store tokens in localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Store user data
   */
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Clear user data
   */
  clearUser(): void {
    localStorage.removeItem('user');
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
