import { AuthService } from '../../modules/auth/auth.service';
import { AuthError } from '../../types/auth.types';

// Mock Prisma for integration tests
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
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

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
  argon2id: 'argon2id',
}));

describe('Auth Integration Tests', () => {
  let authService: AuthService;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    authService = new AuthService(mockPrisma as any);
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

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
      mockSessionRepository.createSession.mockResolvedValue({ 
        id: 'session123',
        refreshToken: 'refresh123'
      });

      const { hash } = require('argon2');
      hash.mockResolvedValue(hashedPassword);

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          name: userData.name,
        },
      });
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(authService.register(userData)).rejects.toThrow(
        new AuthError('USER_EXISTS', 'User with this email already exists')
      );
    });
  });

  describe('User Login', () => {
    it('should login user successfully with valid credentials', async () => {
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

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSessionRepository.createSession.mockResolvedValue({ 
        id: 'session123',
        refreshToken: 'refresh123'
      });

      const { verify } = require('argon2');
      verify.mockResolvedValue(true);

      const result = await authService.login(loginData, '127.0.0.1', 'test-agent');

      expect(result.user.email).toBe(loginData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
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

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const { verify } = require('argon2');
      verify.mockResolvedValue(false);

      await expect(authService.login(loginData, '127.0.0.1', 'test-agent')).rejects.toThrow(
        new AuthError('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        refreshToken: 'refresh123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

    it('should reject refresh with invalid token', async () => {
      mockSessionRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toThrow(
        new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token')
      );
    });
  });

  describe('User Logout', () => {
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
  });

  describe('Password Change', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const { verify, hash } = require('argon2');
      verify.mockResolvedValue(true);
      hash.mockResolvedValue('newHashedPassword');
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
  });

  describe('Profile Management', () => {
    it('should get user profile successfully', async () => {
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
  });

  describe('Session Management', () => {
    it('should get user sessions successfully', async () => {
      const mockSessions = [
        { id: 'session1', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
        { id: 'session2', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
      ];

      mockSessionRepository.findActiveSessionsByUserId.mockResolvedValue(mockSessions);

      const result = await authService.getUserSessions('user123');

      expect(result).toHaveLength(2);
      expect(mockSessionRepository.findActiveSessionsByUserId).toHaveBeenCalledWith('user123');
    });

    it('should revoke session successfully', async () => {
      mockSessionRepository.revokeSession.mockResolvedValue(true);

      const result = await authService.revokeSession('user123', 'session123');

      expect(result).toBe(true);
      expect(mockSessionRepository.revokeSession).toHaveBeenCalledWith('session123', 'user123');
    });

    it('should revoke all sessions successfully', async () => {
      mockSessionRepository.revokeAllSessionsByUserId.mockResolvedValue(3);

      const result = await authService.revokeAllSessions('user123');

      expect(result).toBe(3);
      expect(mockSessionRepository.revokeAllSessionsByUserId).toHaveBeenCalledWith('user123');
    });
  });
});
