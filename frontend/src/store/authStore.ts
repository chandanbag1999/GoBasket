import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import type { User, LoginFormData, RegisterFormData } from '@/types';

/**
 * Authentication Store Interface
 * Defines the shape of the auth store state and actions
 */
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginFormData) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Authentication Store using Zustand
 * 
 * Features:
 * - Persistent storage with localStorage
 * - Type-safe state management
 * - Async action support
 * - Error handling
 * - Loading states
 * 
 * This store manages:
 * - User authentication state
 * - Login/logout functionality
 * - User profile data
 * - Authentication errors
 * - Loading states for auth operations
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      
      /**
       * Login Action
       * Authenticates user with email and password
       * @param credentials - Login form data
       */
      login: async (credentials: LoginFormData) => {
        set({ isLoading: true, error: null });

        try {
          // Import auth service dynamically to avoid circular dependencies
          const { default: authService } = await import('@/services/authService');
          
          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            // Store tokens in localStorage
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            
            // Update store state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      /**
       * Register Action
       * Creates new user account
       * @param userData - Registration form data
       */
      register: async (userData: RegisterFormData) => {
        set({ isLoading: true, error: null });

        try {
          const { default: authService } = await import('@/services/authService');
          
          const response = await authService.register(userData);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            // Store tokens in localStorage
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            
            // Update store state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      /**
       * Logout Action
       * Clears user session and tokens
       */
      logout: () => {
        // Clear tokens from localStorage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        // Reset store state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      /**
       * Update User Action
       * Updates user profile data
       * @param userData - Partial user data to update
       */
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
        }
      },

      /**
       * Clear Error Action
       * Clears authentication error state
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set Loading Action
       * Updates loading state
       * @param loading - Loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
