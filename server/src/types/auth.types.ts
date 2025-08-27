import { Request } from 'express';

// JWT Payload types
export interface JWTAccessPayload {
  userId: string;
  email: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface JWTRefreshPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

// Request types with user context
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
  id?: string; // Add request ID property
}

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  refreshToken: string; // Add missing refreshToken property
}

export interface RefreshResponse {
  accessToken: string;
}

// Session types
export interface SessionData {
  id: string;
  userId: string;
  refreshToken: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface UserData {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Error class
export class AuthError extends Error {
  public code: string;
  public details?: Record<string, unknown> | undefined;

  constructor(code: string, message: string, details?: Record<string, unknown> | undefined) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
  }
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}
