import { useAuthStore } from '@/store';

/**
 * Authentication Hook
 * 
 * This hook provides a convenient interface to the auth store
 * and handles authentication-related operations.
 * 
 * Features:
 * - Access to current user data
 * - Authentication status
 * - Login/logout functionality
 * - Loading states
 * - Error handling
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    updateProfile,
    clearError
  } = useAuthStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    register,
    updateProfile,
    clearError,
    
    // Computed values
    isGuest: !isAuthenticated,
    userName: user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '') || '',
    userEmail: user?.email || '',
    userRole: user?.role || 'customer',
    userAvatar: typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.secure_url || null,
  };
};

export default useAuth;
