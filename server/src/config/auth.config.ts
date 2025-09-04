import dotenv from 'dotenv';
import { validateServerEnv, type ServerEnv } from '../../../tools/env-schema';

// Load environment variables
dotenv.config();

// Validate environment variables early (skip in test environment)
let env: ServerEnv;
try {
  env = validateServerEnv();
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Environment validation failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
  // In test environment, use mock values
  env = {
    DATABASE_URL: 'file:./test.db',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough-32-chars',
    COOKIE_SECRET: 'test-cookie-secret-16-chars',
    CSRF_SECRET: 'test-csrf-secret-16-chars',
    CORS_ORIGIN: 'http://localhost:3000',
    PORT: 3000,
    NODE_ENV: 'test',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    LOGIN_RATE_LIMIT_WINDOW_MS: 900000,
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: 5,
    JWT_ALGORITHM: 'HS256',
    JWT_ACCESS_TOKEN_EXPIRY: '10m',
    JWT_REFRESH_TOKEN_EXPIRY: '7d',
  } as ServerEnv;
}

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    algorithm: env.JWT_ALGORITHM,
    accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
  },
  security: {
    cookieSecret: env.COOKIE_SECRET,
    csrfSecret: env.CSRF_SECRET,
    passwordMinLength: 8,
    maxFailedLoginAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    accountLockoutDuration: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  },
  rateLimiting: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    loginWindowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    maxLoginAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
  cookies: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
} as const;

// Validation function to ensure required config is present
export function validateAuthConfig(): void {
  // Environment variables are already validated by validateServerEnv()
  // This function is kept for backward compatibility
  console.log('✅ Environment validation passed');
}
