import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../modules/auth/auth.controller';

import { AuthError } from '../../types/auth.types';

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  changePassword: jest.fn(),
  getUserSessions: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
} as any;

// Mock Response object
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock NextFunction
const mockNext = jest.fn() as NextFunction;

describe('AuthController', () => {
  let authController: AuthController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController(mockAuthService);
    mockReq = {
      body: {},
      cookies: {},
      params: {},
      ip: '127.0.0.1',
      get: jest.fn(),
    } as any;
    mockRes = mockResponse();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const mockResult = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access123',
        refreshToken: 'refresh123',
      };

      mockReq.body = userData;
      mockAuthService.register.mockResolvedValue(mockResult);

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'refresh123', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
        },
      });
    });

    it('should handle registration errors', async () => {
      const userData = { email: 'test@example.com', password: 'pass' };
      mockReq.body = userData;
      
      const error = new AuthError('USER_EXISTS', 'User already exists');
      mockAuthService.register.mockRejectedValue(error);

      await authController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockResult = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access123',
        refreshToken: 'refresh123',
      };

      mockReq.body = loginData;
      (mockReq as any).ip = '127.0.0.1';
      (mockReq.get as jest.Mock).mockReturnValue('test-agent');
      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData, '127.0.0.1', 'test-agent');
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'refresh123', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
        },
      });
    });

    it('should handle login errors', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' };
      mockReq.body = loginData;
      
      const error = new AuthError('INVALID_CREDENTIALS', 'Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await authController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResult = { accessToken: 'newAccess123' };
      mockReq.cookies = { refreshToken: 'refresh123' };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle missing refresh token', async () => {
      mockReq.cookies = {};

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is required',
        },
      });
    });

    it('should handle refresh token errors', async () => {
      mockReq.cookies = { refreshToken: 'invalid' };
      const error = new AuthError('INVALID_REFRESH_TOKEN', 'Invalid token');
      mockAuthService.refreshToken.mockRejectedValue(error);

      await authController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockReq.cookies = { refreshToken: 'refresh123' };
      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh123');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout without refresh token', async () => {
      mockReq.cookies = {};

      await authController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
      };

      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { profile: mockProfile },
      });
    });

    it('should handle unauthorized access', async () => {
      (mockReq as any).user = undefined;

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should handle profile not found', async () => {
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockAuthService.getUserProfile.mockResolvedValue(null);

      await authController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = { name: 'Updated Name' };
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockReq.body = updateData;
      mockAuthService.updateUserProfile.mockResolvedValue(undefined);

      await authController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
      });
    });

    it('should handle unauthorized access', async () => {
      (mockReq as any).user = undefined;

      await authController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = { currentPassword: 'oldPass', newPassword: 'newPass123!' };
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockReq.body = passwordData;
      mockAuthService.changePassword.mockResolvedValue(undefined);

      await authController.changePassword(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith('user123', 'oldPass', 'newPass123!');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      });
    });

    it('should handle unauthorized access', async () => {
      (mockReq as any).user = undefined;

      await authController.changePassword(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        { id: 'session1', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
        { id: 'session2', createdAt: new Date(), expiresAt: new Date(), isRevoked: false },
      ];

      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockAuthService.getUserSessions.mockResolvedValue(mockSessions);

      await authController.getUserSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.getUserSessions).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { sessions: mockSessions },
      });
    });

    it('should handle unauthorized access', async () => {
      (mockReq as any).user = undefined;

      await authController.getUserSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockReq.params = { sessionId: 'session123' };
      mockAuthService.revokeSession.mockResolvedValue(true);

      await authController.revokeSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.revokeSession).toHaveBeenCalledWith('user123', 'session123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session revoked successfully',
      });
    });

    it('should handle session not found', async () => {
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockReq.params = { sessionId: 'nonexistent' };
      mockAuthService.revokeSession.mockResolvedValue(false);

      await authController.revokeSession(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or already revoked',
        },
      });
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions successfully', async () => {
      (mockReq as any).user = { userId: 'user123', email: 'test@example.com' };
      mockAuthService.revokeAllSessions.mockResolvedValue(3);

      await authController.revokeAllSessions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthService.revokeAllSessions).toHaveBeenCalledWith('user123');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'All sessions revoked successfully',
        data: { revokedCount: 3 },
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await authController.healthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Auth service is healthy',
        timestamp: expect.any(String),
        service: 'auth-service',
      });
    });
  });
});
