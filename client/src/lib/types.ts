// User roles
export type UserRole = 'USER' | 'ADMIN';

// User profile data
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

// Authentication state
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Auth API responses
export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface SignupResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileFormData {
  name?: string;
  email?: string;
}

// Session data
export interface Session {
  id: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
}
