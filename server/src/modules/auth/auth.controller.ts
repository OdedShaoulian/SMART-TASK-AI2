import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { logger } from '../../utils/logger';
import { authConfig } from '../../config/auth.config';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;

      const result = await this.authService.register({ email, password, name });

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: authConfig.cookies.httpOnly,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
        maxAge: authConfig.cookies.maxAge,
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });

      logger.info('User registration successful', { 
        requestId: req.id, 
        email: result.user.email 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate user login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await this.authService.login({ email, password }, ip, userAgent);

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: authConfig.cookies.httpOnly,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
        maxAge: authConfig.cookies.maxAge,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });

      logger.info('User login successful', { 
        requestId: req.id, 
        email: result.user.email 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_MISSING',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });

      logger.info('Token refresh successful', { requestId: req.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: authConfig.cookies.httpOnly,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });

      logger.info('User logout successful', { requestId: req.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const profile = await this.authService.getUserProfile(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { profile },
      });

      logger.info('Profile retrieved successfully', { 
        requestId: req.id, 
        userId 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { name, email } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await this.authService.updateUserProfile(userId, { name, email });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
      });

      logger.info('Profile updated successfully', { 
        requestId: req.id, 
        userId 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      // Clear all cookies to force re-authentication
      res.clearCookie('refreshToken', {
        httpOnly: authConfig.cookies.httpOnly,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      });

      logger.info('Password changed successfully', { 
        requestId: req.id, 
        userId 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const sessions = await this.authService.getUserSessions(userId);

      res.status(200).json({
        success: true,
        data: { sessions },
      });

      logger.info('User sessions retrieved successfully', { 
        requestId: req.id, 
        userId,
        sessionCount: sessions.length 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const revoked = await this.authService.revokeSession(userId, sessionId);

      if (!revoked) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or already revoked',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
      });

      logger.info('Session revoked successfully', { 
        requestId: req.id, 
        userId,
        sessionId 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const revokedCount = await this.authService.revokeAllSessions(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: authConfig.cookies.httpOnly,
        secure: authConfig.cookies.secure,
        sameSite: authConfig.cookies.sameSite,
      });

      res.status(200).json({
        success: true,
        message: 'All sessions revoked successfully',
        data: { revokedCount },
      });

      logger.info('All sessions revoked successfully', { 
        requestId: req.id, 
        userId,
        revokedCount 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Auth service is healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
    });
  }
}
