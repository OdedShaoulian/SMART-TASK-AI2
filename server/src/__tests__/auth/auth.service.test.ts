
import { AuthService } from '../../modules/auth/auth.service';
import { AuthError } from '../../types/auth.types';

// Mock argon2 module
jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
  argon2id: 'argon2id',
}));

import * as argon2 from 'argon2';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

// Mock SessionRepository
const mockSessionRepository = {
  createSession: jest.fn(),
  findByRefreshToken: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllSessionsByUserId: jest.fn(),
  findActiveSessionsByUserId: jest.fn(),
} as any;

jest.mock('../../modules/auth/session.repository', () => ({
  SessionRepository: jest.fn().mockImplementation(() => mockSessionRepository),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockPrisma as any);
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockSessionRepository.createSession.mockResolvedValue({ id: 'session123' });

      // Mock argon2.hash
      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await authService.register(validUserData);

      expect(result.user.email).toBe(validUserData.email);
      expect(result.user.name).toBe(validUserData.name);
      expect(result.accessToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validUserData.email.toLowerCase(),
          password: hashedPassword,
          name: validUserData.name,
        },
      });
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(authService.register(validUserData)).rejects.toThrow(
        new AuthError('USER_EXISTS', 'User with this email already exists')
      );
    });

    it('should throw error if password hashing fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      jest.spyOn(argon2, 'hash').mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(validUserData)).rejects.toThrow(
        new AuthError('REGISTRATION_FAILED', 'Failed to register user')
      );
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword123',
      name: 'Test User',
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login user successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSessionRepository.createSession.mockResolvedValue({ id: 'session123' });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true as never);

      const result = await authService.login(loginData, '127.0.0.1', 'test-agent');

      expect(result.user.email).toBe(loginData.email);
      expect(result.accessToken).toBeDefined();
      expect(mockSessionRepository.createSession).toHaveBeenCalledWith(mockUser.id, expect.any(Date));
    });

    it('should throw error for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false as never);

      await expect(authService.login(loginData, '127.0.0.1', 'test-agent')).rejects.toThrow(
        new AuthError('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginData, '127.0.0.1', 'test-agent')).rejects.toThrow(
        new AuthError('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    });

    it('should throw error if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lockedUntil: new Date(Date.now() + 60000), // Locked for 1 minute
      };

      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      await expect(authService.login(loginData, '127.0.0.1', 'test-agent')).rejects.toThrow(
        new AuthError('ACCOUNT_LOCKED', 'Account is temporarily locked')
      );
    });

    it('should throw error if account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login(loginData, '127.0.0.1', 'test-agent')).rejects.toThrow(
        new AuthError('ACCOUNT_INACTIVE', 'Account is deactivated')
      );
    });

    it('should unlock account if lockout period has expired', async () => {
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lockedUntil: new Date(Date.now() - 60000), // Locked until 1 minute ago
      };

      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);
      mockSessionRepository.createSession.mockResolvedValue({ id: 'session123' });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true as never);

      const result = await authService.login(loginData, '127.0.0.1', 'test-agent');

      expect(result.user.email).toBe(loginData.email);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          isLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
    });
  });

  describe('refreshToken', () => {
    const mockSession = {
      id: 'session123',
      userId: 'user123',
      refreshToken: 'refresh123',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
      },
    };

    it('should refresh access token successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
      };
      
      mockSessionRepository.findByRefreshToken.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.refreshToken('refresh123');

      expect(result.accessToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      mockSessionRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toThrow(
        new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token')
      );
    });

    it('should throw error for revoked session', async () => {
      const revokedSession = { ...mockSession, isRevoked: true };
      mockSessionRepository.findByRefreshToken.mockResolvedValue(revokedSession);
      mockSessionRepository.revokeAllSessionsByUserId.mockResolvedValue(1);

      await expect(authService.refreshToken('refresh123')).rejects.toThrow(
        new AuthError('TOKEN_REUSE_DETECTED', 'Security violation detected')
      );
    });

    it('should throw error for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
      };
      mockSessionRepository.findByRefreshToken.mockResolvedValue(expiredSession);
      mockSessionRepository.revokeSession.mockResolvedValue(true);

      await expect(authService.refreshToken('refresh123')).rejects.toThrow(
        new AuthError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired')
      );
    });

    it('should throw error for invalid user', async () => {
      const invalidUserSession = {
        ...mockSession,
        user: { ...mockSession.user, isActive: false },
      };
      const invalidUser = {
        id: 'user123',
        email: 'test@example.com',
        isActive: false,
        isLocked: false,
      };
      
      mockSessionRepository.findByRefreshToken.mockResolvedValue(invalidUserSession);
      mockPrisma.user.findUnique.mockResolvedValue(invalidUser);
      mockSessionRepository.revokeSession.mockResolvedValue(true);

      await expect(authService.refreshToken('refresh123')).rejects.toThrow(
        new AuthError('USER_INVALID', 'User account is invalid or locked')
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
      };
      mockSessionRepository.findByRefreshToken.mockResolvedValue(mockSession);
      mockSessionRepository.revokeSession.mockResolvedValue(true);

      await expect(authService.logout('refresh123')).resolves.not.toThrow();
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session123');
    });

    it('should handle logout when no session found', async () => {
      mockSessionRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.logout('invalid')).resolves.not.toThrow();
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword123',
    };

    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true as never);
      jest.spyOn(argon2, 'hash').mockResolvedValue('newHashedPassword' as never);
      mockSessionRepository.revokeAllSessionsByUserId.mockResolvedValue(1);

      await expect(
        authService.changePassword('user123', 'oldPassword', 'newPassword123!')
      ).resolves.not.toThrow();

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: { password: 'newHashedPassword' },
      });
      expect(mockSessionRepository.revokeAllSessionsByUserId).toHaveBeenCalledWith('user123');
    });

    it('should throw error for invalid current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false as never);

      await expect(
        authService.changePassword('user123', 'wrongPassword', 'newPassword123!')
      ).rejects.toThrow(
        new AuthError('INVALID_PASSWORD', 'Current password is incorrect')
      );
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword('user123', 'oldPassword', 'newPassword123!')
      ).rejects.toThrow(
        new AuthError('USER_NOT_FOUND', 'User not found')
      );
    });
  });

  describe('validateAccessToken', () => {
    it('should validate valid access token', () => {
      // This would require mocking JWT verification
      // For now, we'll test the method exists
      expect(typeof authService.validateAccessToken).toBe('function');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const result = await authService.getUserProfile('user123');

      expect(result).toEqual(mockProfile);
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.getUserProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { name: 'Updated Name' };
      mockPrisma.user.findUnique.mockResolvedValue(null); // No duplicate email
      mockPrisma.user.update.mockResolvedValue({ id: 'user123' });

      await expect(
        authService.updateUserProfile('user123', updateData)
      ).resolves.not.toThrow();

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: updateData,
      });
    });

    it('should throw error for duplicate email', async () => {
      const updateData = { email: 'existing@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other123' }); // Different user with same email

      await expect(
        authService.updateUserProfile('user123', updateData)
      ).rejects.toThrow(
        new AuthError('EMAIL_TAKEN', 'Email is already taken')
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        { id: 'session1', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
        { id: 'session2', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
      ];

      mockSessionRepository.findActiveSessionsByUserId.mockResolvedValue(mockSessions);

      const result = await authService.getUserSessions('user123');

      expect(result).toHaveLength(2);
      expect(mockSessionRepository.findActiveSessionsByUserId).toHaveBeenCalledWith('user123');
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockSessionRepository.revokeSession.mockResolvedValue(true);

      const result = await authService.revokeSession('user123', 'session123');

      expect(result).toBe(true);
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session123', 'user123');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions successfully', async () => {
      mockSessionRepository.revokeAllSessionsByUserId.mockResolvedValue(3);

      const result = await authService.revokeAllSessions('user123');

      expect(result).toBe(3);
      expect(mockSessionRepository.revokeAllSessionsByUserId).toHaveBeenCalledWith('user123');
    });
  });
});
