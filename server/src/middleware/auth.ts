import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';

/**
 * Middleware to authenticate JWT access tokens
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Access token is required',
        },
      });
      return;
    }

    // Create a temporary auth service instance to validate the token
    const prisma = new PrismaClient();
    const authService = new AuthService(prisma);
    
    const decoded = authService.validateAccessToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
      return;
    }

    // Add user information to the request object
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    logger.debug('Token authenticated successfully', {
      requestId: req.id,
      userId: decoded.userId,
      email: decoded.email,
    });

    next();
  } catch (error) {
    logger.error('Token authentication failed', {
      requestId: req.id,
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const prisma = new PrismaClient();
      const authService = new AuthService(prisma);
      
      const decoded = authService.validateAccessToken(token);
      
      if (decoded) {
        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
        };

        logger.debug('Optional auth successful', {
          requestId: req.id,
          userId: decoded.userId,
        });
      }
    }

    next();
  } catch (error) {
    logger.debug('Optional auth failed, continuing without authentication', {
      requestId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // For now, we'll implement a simple role check
      // In a real application, you'd fetch user roles from the database
      // This is a placeholder implementation
      const userRole = 'user'; // This should come from user data or token

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource',
          },
        });
        return;
      }

      logger.debug('Role check passed', {
        requestId: req.id,
        userId: user.userId,
        requiredRoles: allowedRoles,
        userRole,
      });

      next();
    } catch (error) {
      logger.error('Role check failed', {
        requestId: req.id,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during authorization check',
        },
      });
    }
  };
}

/**
 * CSRF protection middleware using double-submit cookie pattern
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    // Only apply CSRF protection to state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!stateChangingMethods.includes(req.method)) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const csrfCookie = req.cookies['csrf-token'];

    if (!csrfToken || !csrfCookie) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is required for this request',
        },
      });
      return;
    }

    if (csrfToken !== csrfCookie) {
      logger.warn('CSRF token mismatch', {
        requestId: req.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISMATCH',
          message: 'CSRF token validation failed',
        },
      });
      return;
    }

    logger.debug('CSRF protection passed', {
      requestId: req.id,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error('CSRF protection failed', {
      requestId: req.id,
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during CSRF validation',
      },
    });
  }
}

/**
 * Generate and set CSRF token cookie
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Generate a random CSRF token
    const csrfToken = require('crypto').randomBytes(32).toString('hex');
    
    // Set CSRF token as a cookie
    res.cookie('csrf-token', csrfToken, {
      httpOnly: false, // Must be accessible to JavaScript for double-submit
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Add CSRF token to response headers for convenience
    res.setHeader('X-CSRF-Token', csrfToken);

    next();
  } catch (error) {
    logger.error('Failed to generate CSRF token', {
      requestId: req.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
}
