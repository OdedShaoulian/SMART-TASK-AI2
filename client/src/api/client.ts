import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ApiResponse, LoginResponse, SignupResponse, RefreshResponse, User } from '@/lib/types';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    // Get access token from memory (Zustand store) - not localStorage for security
    const accessToken = (window as any).__authToken || null;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post<ApiResponse<RefreshResponse>>(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        if (refreshResponse.data.success && refreshResponse.data.data) {
          // Store new access token in memory (not localStorage for security)
          (window as any).__authToken = refreshResponse.data.data.accessToken;
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, it might be due to token reuse detection
        const refreshErrorResponse = refreshError as AxiosError<ApiResponse>;
        
        if (refreshErrorResponse.response?.data?.error?.code === 'TOKEN_REUSE_DETECTED') {
          // Security violation - force logout
          (window as any).__authToken = null;
          window.location.href = '/login?error=security_violation';
          return Promise.reject(refreshError);
        }
        
        // Other refresh errors - redirect to login
        (window as any).__authToken = null;
        window.location.href = '/login?error=session_expired';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authApi = {
  // Sign up new user
  signup: async (data: { email: string; password: string; name: string }) => {
    const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/verify-email', { token });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/forgot', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/reset', { token, newPassword });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<{ profile: User }>>('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await apiClient.put<ApiResponse>('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.put<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  // Get user sessions
  getSessions: async () => {
    const response = await apiClient.get<ApiResponse<{ sessions: any[] }>>('/auth/sessions');
    return response.data;
  },

  // Revoke specific session
  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete<ApiResponse>(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Revoke all sessions
  revokeAllSessions: async () => {
    const response = await apiClient.delete<ApiResponse>('/auth/sessions');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Refresh token (called automatically by interceptor)
  refresh: async () => {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    return response.data;
  },
};

export default apiClient;
