import { describe, expect, it, vi } from 'vitest';

import { registerDesktopAccount } from '../registerDesktopAccount';
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
    createRegisterUrl: () => 'http://localhost:3000/api/v1/auth/register',
    register: gateway.register.bind(gateway),
  };
}

describe('registerDesktopAccount', () => {
  it('returns OFFLINE before calling the API when network is unavailable', async () => {
    const fetchImpl = vi.fn();

    const result = await registerDesktopAccount(
      {
        email: 'offline@example.com',
        password: 'secret123',
        username: 'offline-user',
      },
      {
        isOnline: () => false,
        remoteGateway: createRemoteGatewayMock(fetchImpl),
        logger: createLogger(),
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'OFFLINE',
        message: '注册需要网络连接，请检查网络后重试。离线状态下可使用访客模式或已有账户登录。',
        shouldFallbackToOffline: true,
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns AUTH_SERVICE_UNREACHABLE when the auth API cannot be reached', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await registerDesktopAccount(
      {
        email: 'unreachable@example.com',
        password: 'secret123',
        username: 'unreachable-user',
      },
      {
        isOnline: () => true,
        remoteGateway: createRemoteGatewayMock(fetchImpl),
        logger: createLogger(),
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'REMOTE_UNREACHABLE',
        message: '无法连接到认证服务，请确认接口已启动后重试',
        shouldFallbackToOffline: true,
      },
    });
  });

  it('returns CONFLICT when the API reports an existing account', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: '用户已存在' }),
    });

    const result = await registerDesktopAccount(
      {
        email: 'exists@example.com',
        password: 'secret123',
        username: 'existing-user',
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
        code: 'CONFLICT',
        message: '用户已存在',
        shouldFallbackToOffline: false,
      },
    });
  });
});
