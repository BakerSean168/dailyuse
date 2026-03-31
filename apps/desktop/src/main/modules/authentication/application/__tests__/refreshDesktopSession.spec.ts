import { describe, expect, it, vi } from 'vitest';

import { AuthRemoteGateway } from '../AuthRemoteGateway';
import { refreshDesktopSession } from '../refreshDesktopSession';

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
    createRefreshUrl: () => 'http://localhost:3000/api/v1/auth/refresh',
    refreshToken: gateway.refreshToken.bind(gateway),
  };
}

describe('refreshDesktopSession', () => {
  it('returns OFFLINE and allows fallback when network is unavailable', async () => {
    const result = await refreshDesktopSession(
      {
        refreshToken: 'refresh-token',
        sessionId: 'session-1',
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

  it('returns REFRESH_FAILED without fallback when API rejects refresh token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: '刷新令牌无效' }),
    });

    const result = await refreshDesktopSession(
      {
        refreshToken: 'refresh-token',
        sessionId: 'session-1',
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
        code: 'REFRESH_FAILED',
        message: '刷新令牌无效',
        shouldFallbackToOffline: false,
      },
    });
  });

  it('returns refreshed token data when API refresh succeeds', async () => {
    const authPayload = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
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

    const result = await refreshDesktopSession(
      {
        refreshToken: 'refresh-token',
        sessionId: 'session-1',
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
