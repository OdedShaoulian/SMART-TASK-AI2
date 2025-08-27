import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * 404 Not Found handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  // Log the 404 request
  logger.warn('Route not found', {
    requestId: req.id,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Return 404 response
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested route was not found',
      details: {
        path: req.path,
        method: req.method,
        availableEndpoints: {
          root: 'GET /',
          health: 'GET /health',
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            profile: 'GET /api/auth/profile',
            'update-profile': 'PUT /api/auth/profile',
            'change-password': 'PUT /api/auth/change-password',
            sessions: 'GET /api/auth/sessions',
            'revoke-session': 'DELETE /api/auth/sessions/:sessionId',
            'revoke-all-sessions': 'DELETE /api/auth/sessions',
          },
        },
      },
    },
  });
}
