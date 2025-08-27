import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../../middleware/validation';
import { authenticateToken } from '../../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { authConfig } from '../../config/auth.config';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.validators';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authService = new AuthService(prisma);
  const authController = new AuthController(authService);

  // Rate limiting for general auth endpoints
  const generalRateLimit = rateLimit({
    windowMs: authConfig.rateLimiting.windowMs,
    max: authConfig.rateLimiting.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limiting for login attempts
  const loginRateLimit = rateLimit({
    windowMs: authConfig.rateLimiting.loginWindowMs,
    max: authConfig.rateLimiting.maxLoginAttempts,
    message: {
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // Stricter rate limiting for registration
  const registrationRateLimit = rateLimit({
    windowMs: authConfig.rateLimiting.loginWindowMs,
    max: 3, // Allow only 3 registrations per 15 minutes
    message: {
      success: false,
      error: {
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all auth routes
  router.use(generalRateLimit);

  // Public routes (no authentication required)
  router.post(
    '/register',
    registrationRateLimit,
    validateRequest(registerSchema),
    authController.register.bind(authController)
  );

  router.post(
    '/login',
    loginRateLimit,
    validateRequest(loginSchema),
    authController.login.bind(authController)
  );

  router.post(
    '/refresh',
    validateRequest(refreshTokenSchema),
    authController.refreshToken.bind(authController)
  );

  router.post(
    '/logout',
    validateRequest(logoutSchema),
    authController.logout.bind(authController)
  );

  // Health check endpoint
  router.get('/health', authController.healthCheck.bind(authController));

  // Protected routes (authentication required)
  router.use(authenticateToken);

  router.get('/profile', authController.getProfile.bind(authController));
  
  router.put(
    '/profile',
    validateRequest(updateProfileSchema),
    authController.updateProfile.bind(authController)
  );

  router.put(
    '/change-password',
    validateRequest(changePasswordSchema),
    authController.changePassword.bind(authController)
  );

  router.get('/sessions', authController.getUserSessions.bind(authController));
  
  router.delete('/sessions/:sessionId', authController.revokeSession.bind(authController));
  
  router.delete('/sessions', authController.revokeAllSessions.bind(authController));

  return router;
}
