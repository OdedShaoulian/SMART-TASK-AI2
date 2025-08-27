import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { LoginFormData, SignupFormData } from '@/lib/schemas';

/**
 * Hook for authentication operations
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (data: LoginFormData) => {
      await login(data.email, data.password);
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/dashboard');
      }
    },
    [login, navigate]
  );

  const handleSignup = useCallback(
    async (data: SignupFormData) => {
      await signup(data.email, data.password, data.name);
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/dashboard');
      }
    },
    [signup, navigate]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    refreshUser,
    clearError,
  };
}

/**
 * Hook for checking if user has required role
 */
export function useRole(requiredRole: 'USER' | 'ADMIN') {
  const { user } = useAuthStore();
  
  if (!user) return false;
  
  const roleHierarchy = { USER: 1, ADMIN: 2 };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Hook for checking if user is admin
 */
export function useIsAdmin() {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN';
}
