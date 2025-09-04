import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateServerEnv, validateClientEnv } from './env-schema';

describe('Environment Schema Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('validateServerEnv', () => {
    it('should validate with all required environment variables', () => {
      process.env = {
        DATABASE_URL: 'file:./test.db',
        JWT_SECRET: 'test-jwt-secret-that-is-long-enough-32-chars',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
        PORT: '3000',
        NODE_ENV: 'test',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
        LOGIN_RATE_LIMIT_MAX_ATTEMPTS: '5',
        JWT_ALGORITHM: 'HS256',
        JWT_ACCESS_TOKEN_EXPIRY: '10m',
        JWT_REFRESH_TOKEN_EXPIRY: '7d',
      };

      expect(() => validateServerEnv()).not.toThrow();
      const result = validateServerEnv();
      expect(result.DATABASE_URL).toBe('file:./test.db');
      expect(result.JWT_SECRET).toBe('test-jwt-secret-that-is-long-enough-32-chars');
      expect(result.CORS_ORIGIN).toBe('http://localhost:3000');
    });

    it('should throw error when DATABASE_URL is missing', () => {
      process.env = {
        JWT_SECRET: 'test-jwt-secret-that-is-long-enough-32-chars',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
      };

      expect(() => validateServerEnv()).toThrow('Environment validation failed');
      expect(() => validateServerEnv()).toThrow('DATABASE_URL');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env = {
        DATABASE_URL: 'file:./test.db',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
      };

      expect(() => validateServerEnv()).toThrow('Environment validation failed');
      expect(() => validateServerEnv()).toThrow('JWT_SECRET');
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env = {
        DATABASE_URL: 'file:./test.db',
        JWT_SECRET: 'short',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
      };

      expect(() => validateServerEnv()).toThrow('Environment validation failed');
      expect(() => validateServerEnv()).toThrow('JWT_SECRET');
    });

    it('should use default values for optional variables', () => {
      process.env = {
        DATABASE_URL: 'file:./test.db',
        JWT_SECRET: 'test-jwt-secret-that-is-long-enough-32-chars',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
      };

      const result = validateServerEnv();
      expect(result.PORT).toBe(3000);
      expect(result.NODE_ENV).toBe('development');
      expect(result.JWT_ALGORITHM).toBe('HS256');
    });

    it('should validate URL format for DATABASE_URL', () => {
      process.env = {
        DATABASE_URL: 'invalid-url',
        JWT_SECRET: 'test-jwt-secret-that-is-long-enough-32-chars',
        COOKIE_SECRET: 'test-cookie-secret-16-chars',
        CSRF_SECRET: 'test-csrf-secret-16-chars',
        CORS_ORIGIN: 'http://localhost:3000',
      };

      expect(() => validateServerEnv()).toThrow('Environment validation failed');
      expect(() => validateServerEnv()).toThrow('DATABASE_URL');
    });
  });

  describe('validateClientEnv', () => {
    it('should validate with required VITE_API_URL', () => {
      process.env = {
        VITE_API_URL: 'http://localhost:3000',
      };

      expect(() => validateClientEnv()).not.toThrow();
      const result = validateClientEnv();
      expect(result.VITE_API_URL).toBe('http://localhost:3000');
    });

    it('should throw error when VITE_API_URL is missing', () => {
      process.env = {};

      expect(() => validateClientEnv()).toThrow('Client environment validation failed');
      expect(() => validateClientEnv()).toThrow('VITE_API_URL');
    });

    it('should validate URL format for VITE_API_URL', () => {
      process.env = {
        VITE_API_URL: 'invalid-url',
      };

      expect(() => validateClientEnv()).toThrow('Client environment validation failed');
      expect(() => validateClientEnv()).toThrow('VITE_API_URL');
    });
  });
});
