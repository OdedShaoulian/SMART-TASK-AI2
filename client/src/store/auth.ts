import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '@/lib/types';
import { authApi } from '@/api/client';



export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            // Store access token in memory only (not localStorage for security)
            (window as any).__authToken = response.data.accessToken;
            
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Login failed',
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Login failed',
          });
        }
      },

      // Signup action
      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.signup({ email, password, name });
          
          if (response.success && response.data) {
            // Store access token in memory only (not localStorage for security)
            (window as any).__authToken = response.data.accessToken;
            
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Signup failed',
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error?.message || 'Signup failed',
          });
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        } finally {
          // Clear access token from memory
          (window as any).__authToken = null;
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh user profile
      refreshUser: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }
        
        set({ isLoading: true });
        
        try {
          const response = await authApi.getProfile();
          
          if (response.success && response.data) {
            set({
              user: response.data.profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: response.error?.message || 'Failed to refresh user',
            });
          }
        } catch (error: any) {
          // If refresh fails, clear auth state
          (window as any).__authToken = null;
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.error?.message || 'Failed to refresh user',
          });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user data, not access token (kept in memory)
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
