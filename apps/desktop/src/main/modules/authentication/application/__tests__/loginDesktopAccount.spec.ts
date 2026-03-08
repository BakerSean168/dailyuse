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
      json: async () => ({ ok: false, error: '密码错误' }),
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
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        identityId: 'user-1',
        sessionId: 'session-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      }),
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
      response: {
        ok: true,
        identityId: 'user-1',
        sessionId: 'session-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      },
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
