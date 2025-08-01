export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => void;
  signup: (data: RegisterFormData) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile?: (data: UpdateProfileData) => Promise<void>;
  userAvatar: string | null;
  userName: string;
}

export interface AuthService {
  login: (credentials: LoginFormData) => Promise<ApiResponse<{ user: User; token: string }>>;
  register: (data: RegisterFormData) => Promise<ApiResponse<{ user: User; token: string }>>;
  logout: () => Promise<ApiResponse<void>>;
  forgotPassword?: (data: { email: string }) => Promise<ApiResponse<void>>;
  resetPassword?: (data: { token: string; password: string }) => Promise<ApiResponse<void>>;
  verifyOTP?: (data: { phone: string; otp: string }) => Promise<ApiResponse<{ user: User; token: string }>>;
  resendOTP?: (data: { phone: string }) => Promise<ApiResponse<void>>;
  refreshToken?: (refreshToken: string) => Promise<ApiResponse<{ token: string; refreshToken: string }>>;
}

// Re-export types from main index for convenience
export type { User, LoginFormData, RegisterFormData, ApiResponse, UpdateProfileData } from './index';
