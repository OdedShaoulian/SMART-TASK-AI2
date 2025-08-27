import { PrismaClient, User } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import { SessionRepository } from './session.repository';
import { authConfig } from '../../config/auth.config';
import { logger, auditLog } from '../../utils/logger';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshResponse,
  AuthError,
} from '../../types/auth.types';

export class AuthService {
  private prisma: PrismaClient;
  private sessionRepository: SessionRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.sessionRepository = new SessionRepository(prisma);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new AuthError('USER_EXISTS', 'User with this email already exists');
      }

      // Hash password with Argon2id
      const hashedPassword = await argon2.hash(data.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64MB
        timeCost: 3, // 3 iterations
        parallelism: 1,
      });

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name || null,
        },
      });

      // Create initial session
      const session = await this.createUserSession(user.id);

      // Generate access token
      const accessToken = this.generateAccessToken(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });
      auditLog('user_registered', user.id, undefined, undefined, { email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          ...(user.name && { name: user.name }),
        },
        accessToken,
        refreshToken: session.refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Registration failed', { 
        email: data.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('REGISTRATION_FAILED', 'Failed to register user');
    }
  }

  /**
   * Authenticate user login
   */
  async login(data: LoginRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (!user) {
        await this.handleFailedLogin(data.email, ip, userAgent);
        throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new AuthError('ACCOUNT_LOCKED', 'Account is temporarily locked');
        } else {
          // Unlock account if lockout period has expired
          await this.unlockAccount(user.id);
        }
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AuthError('ACCOUNT_INACTIVE', 'Account is deactivated');
      }

      // Verify password
      const isValidPassword = await argon2.verify(user.password, data.password);
      if (!isValidPassword) {
        await this.handleFailedLogin(data.email, ip, userAgent);
        throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0) {
        await this.resetFailedLoginAttempts(user.id);
      }

      // Create new session
      const session = await this.createUserSession(user.id);

      // Generate access token
      const accessToken = this.generateAccessToken(user);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });
      auditLog('user_login', user.id, ip, userAgent, { email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          ...(user.name && { name: user.name }),
        },
        accessToken,
        refreshToken: session.refreshToken,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Login failed', { 
        email: data.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('LOGIN_FAILED', 'Failed to authenticate user');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      // Find session by refresh token
      const session = await this.sessionRepository.findByRefreshToken(refreshToken);
      if (!session) {
        throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token');
      }

      // Check if session is revoked
      if (session.isRevoked) {
        // This indicates potential token reuse - revoke all sessions for the user
        await this.sessionRepository.revokeAllSessionsByUserId(session.userId);
        auditLog('token_reuse_detected', session.userId, undefined, undefined, { 
          sessionId: session.id,
          action: 'all_sessions_revoked' 
        });
        throw new AuthError('TOKEN_REUSE_DETECTED', 'Security violation detected');
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await this.sessionRepository.revokeSession(session.id);
        throw new AuthError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
      }

      // Get user data
      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user || !user.isActive || user.isLocked) {
        await this.sessionRepository.revokeSession(session.id);
        throw new AuthError('USER_INVALID', 'User account is invalid or locked');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      logger.info('Access token refreshed', { userId: user.id, sessionId: session.id });
      auditLog('token_refreshed', user.id, undefined, undefined, { sessionId: session.id });

      return { accessToken };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('REFRESH_FAILED', 'Failed to refresh token');
    }
  }

  /**
   * Logout user by revoking session
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findByRefreshToken(refreshToken);
      if (session) {
        await this.sessionRepository.revokeSession(session.id);
        logger.info('User logged out', { userId: session.userId, sessionId: session.id });
        auditLog('user_logout', session.userId, undefined, undefined, { sessionId: session.id });
      }
    } catch (error) {
      logger.error('Logout failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // Don't throw error on logout failure - user should still be logged out
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError('USER_NOT_FOUND', 'User not found');
      }

      // Verify current password
      const isValidPassword = await argon2.verify(user.password, currentPassword);
      if (!isValidPassword) {
        throw new AuthError('INVALID_PASSWORD', 'Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Revoke all sessions to force re-authentication
      await this.sessionRepository.revokeAllSessionsByUserId(userId);

      logger.info('Password changed successfully', { userId });
      auditLog('password_changed', userId, undefined, undefined, { action: 'password_change' });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Password change failed', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('PASSWORD_CHANGE_FAILED', 'Failed to change password');
    }
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        algorithms: [authConfig.jwt.algorithm],
      }) as jwt.JwtPayload;

      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    name?: string;
    isActive: boolean;
    createdAt: Date;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user ? {
        id: user.id,
        email: user.email,
        ...(user.name && { name: user.name }),
        isActive: user.isActive,
        createdAt: user.createdAt,
      } : null;
    } catch (error) {
      logger.error('Failed to get user profile', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: { name?: string; email?: string }): Promise<void> {
    try {
      const updateData: any = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      if (data.email !== undefined) {
        // Check if email is already taken
        const existingUser = await this.prisma.user.findUnique({
          where: { email: data.email.toLowerCase() },
        });
        
        if (existingUser && existingUser.id !== userId) {
          throw new AuthError('EMAIL_TAKEN', 'Email is already taken');
        }
        
        updateData.email = data.email.toLowerCase();
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      logger.info('User profile updated', { userId, updates: Object.keys(updateData) });
      auditLog('profile_updated', userId, undefined, undefined, { updates: Object.keys(updateData) });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Profile update failed', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('PROFILE_UPDATE_FAILED', 'Failed to update profile');
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<Array<{
    id: string;
    createdAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
  }>> {
    try {
      const sessions = await this.sessionRepository.findActiveSessionsByUserId(userId);
      return sessions.map(session => ({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isRevoked: session.isRevoked,
      }));
    } catch (error) {
      logger.error('Failed to get user sessions', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('SESSIONS_FETCH_FAILED', 'Failed to fetch user sessions');
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      return await this.sessionRepository.revokeSession(sessionId, userId);
    } catch (error) {
      logger.error('Failed to revoke session', { 
        userId, 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('SESSION_REVOKE_FAILED', 'Failed to revoke session');
    }
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllSessions(userId: string): Promise<number> {
    try {
      return await this.sessionRepository.revokeAllSessionsByUserId(userId);
    } catch (error) {
      logger.error('Failed to revoke all sessions', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AuthError('SESSIONS_REVOKE_FAILED', 'Failed to revoke sessions');
    }
  }

  // Private helper methods

  private async createUserSession(userId: string): Promise<any> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    return await this.sessionRepository.createSession(userId, expiresAt);
  }

  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'access' as const,
    };

    return (jwt as any).sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.accessTokenExpiry,
      issuer: 'smart-task-ai2',
      audience: 'smart-task-ai2-users',
    });
  }

  private async handleFailedLogin(email: string, ip?: string, userAgent?: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        const newFailedAttempts = user.failedLoginAttempts + 1;
        const shouldLockAccount = newFailedAttempts >= authConfig.security.maxFailedLoginAttempts;

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            ...(shouldLockAccount && {
              isLocked: true,
              lockedUntil: new Date(Date.now() + authConfig.security.accountLockoutDuration),
            }),
          },
        });

        if (shouldLockAccount) {
          auditLog('account_locked', user.id, ip, userAgent, { 
            reason: 'max_failed_attempts',
            failedAttempts: newFailedAttempts 
          });
        } else {
          auditLog('failed_login_attempt', user.id, ip, userAgent, { 
            failedAttempts: newFailedAttempts 
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle failed login', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async unlockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });
  }
}
