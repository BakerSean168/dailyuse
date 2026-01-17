/**
 * AuthSessionPrismaRepository Tests
 *
 * Unit tests for Prisma-based session repository.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthSessionPrismaRepository } from '../auth-session-prisma.repository';
import { AuthSession } from '@dailyuse/domain-server/authentication';

describe('AuthSessionPrismaRepository', () => {
  let repository: AuthSessionPrismaRepository;
  let mockPrismaClient: any;

  beforeEach(() => {
    mockPrismaClient = {
      authSession: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    repository = new AuthSessionPrismaRepository(mockPrismaClient);
  });

  describe('save', () => {
    it('should save session with upsert pattern', async () => {
      const session = AuthSession.create({
        accountUuid: 'account-123',
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        device: {
          deviceId: 'device-123',
          deviceType: 'WEB',
        },
        ipAddress: '192.168.1.1',
      });

      mockPrismaClient.authSession.upsert.mockResolvedValue({
        uuid: session.uuid,
      });

      await repository.save(session);

      expect(mockPrismaClient.authSession.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uuid: session.uuid },
          create: expect.objectContaining({
            uuid: session.uuid,
            accountUuid: 'account-123',
            accessToken: 'access_token_123',
            refreshToken: 'refresh_token_123',
          }),
        })
      );
    });

    it('should serialize device info as JSON', async () => {
      const session = AuthSession.create({
        accountUuid: 'account-123',
        accessToken: 'token',
        refreshToken: 'refresh',
        device: {
          deviceId: 'device-123',
          deviceType: 'MOBILE',
          os: 'iOS',
          browser: 'Safari',
        },
        ipAddress: '192.168.1.1',
      });

      mockPrismaClient.authSession.upsert.mockResolvedValue({});

      await repository.save(session);

      const upsertCall = mockPrismaClient.authSession.upsert.mock.calls[0][0];
      const device = JSON.parse(upsertCall.create.device);

      expect(device.deviceId).toBe('device-123');
      expect(device.deviceType).toBe('MOBILE');
      expect(device.os).toBe('iOS');
      expect(device.browser).toBe('Safari');
    });

    it('should serialize location as JSON', async () => {
      const session = AuthSession.create({
        accountUuid: 'account-123',
        accessToken: 'token',
        refreshToken: 'refresh',
        device: {
          deviceId: 'device-123',
          deviceType: 'WEB',
        },
        ipAddress: '192.168.1.1',
        location: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles',
        },
      });

      mockPrismaClient.authSession.upsert.mockResolvedValue({});

      await repository.save(session);

      const upsertCall = mockPrismaClient.authSession.upsert.mock.calls[0][0];
      const location = JSON.parse(upsertCall.create.userAgent);

      expect(location.country).toBe('US');
      expect(location.region).toBe('CA');
      expect(location.city).toBe('San Francisco');
      expect(location.timezone).toBe('America/Los_Angeles');
    });
  });

  describe('findByUuid', () => {
    it('should find session by UUID', async () => {
      const mockData = {
        uuid: 'session-123',
        accountUuid: 'account-123',
        accessToken: 'access_token_123',
        accessTokenExpiresAt: new Date(Date.now() + 900000),
        refreshToken: 'refresh_token_123',
        refreshTokenExpiresAt: new Date(Date.now() + 2592000000),
        device: JSON.stringify({
          deviceId: 'device-123',
          deviceType: 'WEB',
        }),
        status: 'ACTIVE',
        ipAddress: '192.168.1.1',
        userAgent: null,
        lastAccessedAt: new Date(),
        lastActivityType: 'LOGIN',
        history: '[]',
        expiresAt: new Date(Date.now() + 2592000000),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.authSession.findUnique.mockResolvedValue(mockData);

      const session = await repository.findByUuid('session-123');

      expect(session).toBeDefined();
      expect(session?.uuid).toBe('session-123');
      expect(session?.accountUuid).toBe('account-123');
    });

    it('should return null if not found', async () => {
      mockPrismaClient.authSession.findUnique.mockResolvedValue(null);

      const session = await repository.findByUuid('nonexistent');

      expect(session).toBeNull();
    });
  });

  describe('findByAccessToken', () => {
    it('should find session by access token', async () => {
      const mockData = {
        uuid: 'session-123',
        accountUuid: 'account-123',
        accessToken: 'access_token_123',
        accessTokenExpiresAt: new Date(Date.now() + 900000),
        refreshToken: 'refresh_token_123',
        refreshTokenExpiresAt: new Date(Date.now() + 2592000000),
        device: JSON.stringify({ deviceId: 'device-123', deviceType: 'WEB' }),
        status: 'ACTIVE',
        ipAddress: '192.168.1.1',
        userAgent: null,
        lastAccessedAt: new Date(),
        lastActivityType: null,
        history: '[]',
        expiresAt: new Date(Date.now() + 2592000000),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.authSession.findUnique.mockResolvedValue(mockData);

      const session = await repository.findByAccessToken('access_token_123');

      expect(session).toBeDefined();
      expect(session?.accessToken).toBe('access_token_123');
    });
  });

  describe('findByRefreshToken', () => {
    it('should find session by refresh token', async () => {
      const mockData = {
        uuid: 'session-123',
        accountUuid: 'account-123',
        accessToken: 'access_token_123',
        accessTokenExpiresAt: new Date(Date.now() + 900000),
        refreshToken: 'refresh_token_123',
        refreshTokenExpiresAt: new Date(Date.now() + 2592000000),
        device: JSON.stringify({ deviceId: 'device-123', deviceType: 'WEB' }),
        status: 'ACTIVE',
        ipAddress: '192.168.1.1',
        userAgent: null,
        lastAccessedAt: new Date(),
        lastActivityType: null,
        history: '[]',
        expiresAt: new Date(Date.now() + 2592000000),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.authSession.findUnique.mockResolvedValue(mockData);

      const session = await repository.findByRefreshToken('refresh_token_123');

      expect(session).toBeDefined();
      expect(session?.refreshToken.token).toBe('refresh_token_123');
    });
  });

  describe('findByDeviceId', () => {
    it('should find sessions by device ID', async () => {
      mockPrismaClient.authSession.findMany.mockResolvedValue([
        {
          uuid: 'session-1',
          accountUuid: 'account-123',
          accessToken: 'token-1',
          accessTokenExpiresAt: new Date(),
          refreshToken: 'refresh-1',
          refreshTokenExpiresAt: new Date(),
          device: JSON.stringify({ deviceId: 'device-123', deviceType: 'WEB' }),
          status: 'ACTIVE',
          ipAddress: '192.168.1.1',
          userAgent: null,
          lastAccessedAt: new Date(),
          lastActivityType: null,
          history: '[]',
          expiresAt: new Date(),
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const sessions = await repository.findByDeviceId('device-123');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].device.deviceId).toBe('device-123');
    });
  });

  describe('findActiveSessions', () => {
    it('should find active sessions for account', async () => {
      const futureDate = new Date(Date.now() + 2592000000);

      mockPrismaClient.authSession.findMany.mockResolvedValue([
        {
          uuid: 'session-1',
          accountUuid: 'account-123',
          accessToken: 'token-1',
          accessTokenExpiresAt: new Date(),
          refreshToken: 'refresh-1',
          refreshTokenExpiresAt: futureDate,
          device: JSON.stringify({ deviceId: 'device-1', deviceType: 'WEB' }),
          status: 'ACTIVE',
          ipAddress: '192.168.1.1',
          userAgent: null,
          lastAccessedAt: new Date(),
          lastActivityType: null,
          history: '[]',
          expiresAt: futureDate,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const sessions = await repository.findActiveSessions('account-123');

      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('ACTIVE');
    });
  });

  describe('findByStatus', () => {
    it('should find sessions by status', async () => {
      mockPrismaClient.authSession.findMany.mockResolvedValue([]);

      await repository.findByStatus('EXPIRED');

      expect(mockPrismaClient.authSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'EXPIRED' },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaClient.authSession.findMany.mockResolvedValue([]);

      await repository.findByStatus('ACTIVE', { skip: 10, take: 20 });

      expect(mockPrismaClient.authSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete session by UUID', async () => {
      mockPrismaClient.authSession.delete.mockResolvedValue({});

      await repository.delete('session-123');

      expect(mockPrismaClient.authSession.delete).toHaveBeenCalledWith({
        where: { uuid: 'session-123' },
      });
    });
  });

  describe('deleteByAccountUuid', () => {
    it('should delete all sessions for account', async () => {
      mockPrismaClient.authSession.deleteMany.mockResolvedValue({ count: 3 });

      const count = await repository.deleteByAccountUuid('account-123');

      expect(count).toBe(3);
      expect(mockPrismaClient.authSession.deleteMany).toHaveBeenCalledWith({
        where: { accountUuid: 'account-123' },
      });
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired sessions', async () => {
      mockPrismaClient.authSession.deleteMany.mockResolvedValue({ count: 10 });

      const count = await repository.deleteExpired();

      expect(count).toBe(10);
      expect(mockPrismaClient.authSession.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ status: 'EXPIRED' }),
            ]),
          }),
        })
      );
    });
  });
});
