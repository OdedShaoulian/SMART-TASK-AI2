import { PrismaClient, Session, User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger, auditLog } from '../../utils/logger';


export class SessionRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new session for a user
   */
  async createSession(userId: string, expiresAt: Date): Promise<Session> {
    try {
      const refreshToken = uuidv4();
      
      const session = await this.prisma.session.create({
        data: {
          userId,
          refreshToken,
          expiresAt,
        },
      });

      logger.info('Session created', { userId, sessionId: session.id });
      return session;
    } catch (error) {
      logger.error('Failed to create session', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    try {
      return await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });
    } catch (error) {
      logger.error('Failed to find session by refresh token', { 
        refreshToken: refreshToken.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to find session');
    }
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<Session | null> {
    try {
      return await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });
    } catch (error) {
      logger.error('Failed to find session by ID', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to find session');
    }
  }

  /**
   * Get all active sessions for a user
   */
  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    try {
      return await this.prisma.session.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find active sessions', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to find sessions');
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId?: string): Promise<boolean> {
    try {
      const result = await this.prisma.session.updateMany({
        where: {
          id: sessionId,
          ...(userId && { userId }), // Only revoke if it belongs to the user
        },
        data: { isRevoked: true },
      });

      if (result.count > 0) {
        logger.info('Session revoked', { sessionId, userId });
        auditLog('session_revoked', userId, undefined, undefined, { sessionId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to revoke session', { 
        sessionId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to revoke session');
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessionsByUserId(userId: string): Promise<number> {
    try {
      const result = await this.prisma.session.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });

      logger.info('All sessions revoked for user', { userId, count: result.count });
      auditLog('all_sessions_revoked', userId, undefined, undefined, { sessionCount: result.count });
      
      return result.count;
    } catch (error) {
      logger.error('Failed to revoke all sessions', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to revoke sessions');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        logger.info('Expired sessions cleaned up', { count: result.count });
      }

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to cleanup sessions');
    }
  }

  /**
   * Check if a refresh token has been reused (security feature)
   */
  async isRefreshTokenReused(refreshToken: string): Promise<boolean> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        select: { isRevoked: true },
      });

      return session?.isRevoked ?? false;
    } catch (error) {
      logger.error('Failed to check refresh token reuse', { 
        refreshToken: refreshToken.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to check token reuse');
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    revokedSessions: number;
  }> {
    try {
      const [totalSessions, activeSessions, revokedSessions] = await Promise.all([
        this.prisma.session.count({ where: { userId } }),
        this.prisma.session.count({
          where: {
            userId,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.session.count({
          where: {
            userId,
            isRevoked: true,
          },
        }),
      ]);

      return {
        totalSessions,
        activeSessions,
        revokedSessions,
      };
    } catch (error) {
      logger.error('Failed to get session stats', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to get session statistics');
    }
  }

  /**
   * Update session expiry
   */
  async updateSessionExpiry(sessionId: string, newExpiry: Date): Promise<Session> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiry },
      });

      logger.info('Session expiry updated', { sessionId, newExpiry });
      return session;
    } catch (error) {
      logger.error('Failed to update session expiry', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to update session expiry');
    }
  }

  /**
   * Get user from session
   */
  async getUserFromSession(sessionId: string): Promise<User | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      return session?.user ?? null;
    } catch (error) {
      logger.error('Failed to get user from session', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to get user from session');
    }
  }
}
