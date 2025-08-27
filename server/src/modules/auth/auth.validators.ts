import { z } from 'zod';
import { authConfig } from '../../config/auth.config';

// Email validation with proper format checking
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(authConfig.security.passwordMinLength, `Password must be at least ${authConfig.security.passwordMinLength} characters`)
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
  .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character');

// Name validation (optional)
const nameSchema = z
  .string()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name too long')
  .optional();

// Login request validation
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

// Register request validation
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
  }),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Logout validation
export const logoutSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Change password validation
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
  }),
});

// Update profile validation
export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema.optional(), // Optional for profile updates
  }),
});

// Admin user management schemas
export const adminUpdateUserSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID'),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    name: nameSchema,
    email: emailSchema.optional(),
  }),
});

export const adminDeleteUserSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID'),
  }),
});

// Session management schemas
export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().cuid('Invalid session ID'),
  }),
});

export const revokeAllSessionsSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID'),
  }),
});

// Type exports for use in controllers
export type LoginRequest = z.infer<typeof loginSchema>['body'];
export type RegisterRequest = z.infer<typeof registerSchema>['body'];
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>['cookies'];
export type LogoutRequest = z.infer<typeof logoutSchema>['cookies'];
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>['body'];
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>['body'];
export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserSchema>['body'];
export type AdminUpdateUserParams = z.infer<typeof adminUpdateUserSchema>['params'];
export type AdminDeleteUserParams = z.infer<typeof adminDeleteUserSchema>['params'];
export type RevokeSessionParams = z.infer<typeof revokeSessionSchema>['params'];
export type RevokeAllSessionsParams = z.infer<typeof revokeAllSessionsSchema>['params'];
