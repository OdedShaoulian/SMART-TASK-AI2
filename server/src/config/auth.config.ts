import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    algorithm: (process.env.JWT_ALGORITHM as 'HS512' | 'RS256') || 'HS512',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '10m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },
  security: {
    cookieSecret: process.env.COOKIE_SECRET || 'fallback-cookie-secret-change-in-production',
    csrfSecret: process.env.CSRF_SECRET || 'fallback-csrf-secret-change-in-production',
    passwordMinLength: 8,
    maxFailedLoginAttempts: 5,
    accountLockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  },
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxLoginAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
} as const;

// Validation function to ensure required config is present
export function validateAuthConfig(): void {
  if (!authConfig.jwt.secret || authConfig.jwt.secret === 'fallback-secret-change-in-production') {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (!authConfig.security.cookieSecret || authConfig.security.cookieSecret === 'fallback-cookie-secret-change-in-production') {
    throw new Error('COOKIE_SECRET environment variable is required');
  }
  
  if (!authConfig.security.csrfSecret || authConfig.security.csrfSecret === 'fallback-csrf-secret-change-in-production') {
    throw new Error('CSRF_SECRET environment variable is required');
  }
}
