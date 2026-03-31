import { describe, expect, it, vi } from 'vitest';

import { loginDesktopAccount } from '../loginDesktopAccount';
import { AuthRemoteGateway } from '../AuthRemoteGateway';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createRemoteGatewayMock(fetchImpl: ReturnType<typeof vi.fn>) {
  const gateway = new AuthRemoteGateway(
    fetchImpl as never,
    ((path: string) => `http://localhost:3000/api/v1${path}`) as never,
  );

  return {
    createLoginUrl: () => 'http://localhost:3000/api/v1/auth/login',
    login: gateway.login.bind(gateway),
  };
}

describe('loginDesktopAccount', () => {
  it('returns OFFLINE and allows fallback when network is unavailable', async () => {
    const result = await loginDesktopAccount(
      {
        email: 'offline@example.com',
        password: 'secret123',
      },
      {
        isOnline: () => false,
        remoteGateway: createRemoteGatewayMock(vi.fn()),
        logger: createLogger(),
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'OFFLINE',
        message: 'OFFLINE',
        shouldFallbackToOffline: true,
      },
    });
  });

  it('returns AUTH_FAILED without offline fallback when API rejects credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: '密码错误' }),
    });

    const result = await loginDesktopAccount(
      {
        email: 'user@example.com',
        password: 'wrong-password',
      },
      {
        isOnline: () => true,
        remoteGateway: createRemoteGatewayMock(fetchImpl),
        logger: createLogger(),
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: '密码错误',
        shouldFallbackToOffline: false,
      },
    });
  });

  it('returns ONLINE_USER response when API login succeeds', async () => {
    const authPayload = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      identity: {
        id: 'user-1',
        status: 'Active',
        failedLoginAttempts: 0,
        lastFailedAttempt: null,
        lockedUntil: null,
        identifiers: [],
        credentials: [],
        hasPassword: true,
        hasEmail: true,
        hasPhone: false,
        hasOAuth: false,
        version: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      },
      session: {
        id: 'session-1',
        identityId: 'user-1',
        deviceInfo: {
          deviceId: 'device-1',
          deviceFingerprint: 'fingerprint-1',
          deviceType: 'Desktop',
          deviceName: 'Test Desktop',
          os: 'Windows',
          osVersion: '11',
          browser: 'Memoflow',
          appVersion: '1.0.0',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
          location: null,
          firstSeenAt: 1,
          lastSeenAt: 1,
        },
        isCurrentSession: true,
        version: 1,
        createdAt: 1,
        updatedAt: 1,
        expiresAt: 2,
        lastActiveAt: 1,
        deletedAt: null,
      },
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: authPayload }),
    });

    const onSuccess = vi.fn();

    const result = await loginDesktopAccount(
      {
        email: 'user@example.com',
        password: 'secret123',
      },
      {
        isOnline: () => true,
        remoteGateway: createRemoteGatewayMock(fetchImpl),
        logger: createLogger(),
        onSuccess,
      },
    );

    expect(result).toEqual({
      ok: true,
      response: authPayload,
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
