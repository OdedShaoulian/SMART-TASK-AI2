import { z } from 'zod';

// Base environment schema for server
export const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // JWT & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be at least 16 characters'),
  
  // Optional for cookie rotation
  COOKIE_SECRET_OLD: z.string().min(16, 'COOKIE_SECRET_OLD must be at least 16 characters').optional(),
  
  // CORS & URLs
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL'),
  
  // Server Configuration
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.string().transform(Number).pipe(z.number().positive()).default('5'),
  
  // JWT Configuration
  JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('10m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
});

// Client environment schema
export const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  // Add VITE_CLERK_PUBLISHABLE_KEY if using Clerk
  // VITE_CLERK_PUBLISHABLE_KEY: z.string().optional(),
});

// Azure deployment environment schema (for GitHub Actions)
export const azureEnvSchema = z.object({
  // Azure Backend
  AZURE_CREDENTIALS: z.string().min(1, 'AZURE_CREDENTIALS is required'),
  AZURE_WEBAPP_NAME: z.string().min(1, 'AZURE_WEBAPP_NAME is required'),
  AZURE_WEBAPP_PUBLISH_PROFILE: z.string().min(1, 'AZURE_WEBAPP_PUBLISH_PROFILE is required'),
  AZURE_RESOURCE_GROUP: z.string().min(1, 'AZURE_RESOURCE_GROUP is required'),
  
  // Azure Frontend
  AZURE_STATIC_WEB_APPS_API_TOKEN: z.string().min(1, 'AZURE_STATIC_WEB_APPS_API_TOKEN is required'),
  AZURE_STATIC_WEB_APP_NAME: z.string().min(1, 'AZURE_STATIC_WEB_APP_NAME is required'),
});

// Combined production environment schema
export const productionEnvSchema = serverEnvSchema.merge(azureEnvSchema);

// Staging environment schema (for future use)
export const stagingEnvSchema = serverEnvSchema.merge(azureEnvSchema).extend({
  STAGING_API_URL: z.string().url('STAGING_API_URL must be a valid URL'),
});

// Environment variable types
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type AzureEnv = z.infer<typeof azureEnvSchema>;
export type ProductionEnv = z.infer<typeof productionEnvSchema>;
export type StagingEnv = z.infer<typeof stagingEnvSchema>;

// Validation functions
export function validateServerEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Environment validation failed. Missing or invalid variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

export function validateClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Client environment validation failed. Missing or invalid variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}

export function validateProductionEnv(): ProductionEnv {
  try {
    return productionEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(`Production environment validation failed. Missing or invalid variables: ${missingVars.join(', ')}`);
    }
    throw error;
  }
}
