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
      json: async () => ({ ok: false, error: '刷新令牌无效' }),
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
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      }),
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
      response: {
        ok: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      },
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
