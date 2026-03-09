import { describe, expect, it, vi } from 'vitest';

import { AuthRemoteGateway } from '../AuthRemoteGateway';

describe('AuthRemoteGateway', () => {
  it('posts registration requests to the auth register endpoint', async () => {
    const authPayload = {
      accessToken: 'token',
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
          appVersion: '1.0.0',
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
      status: 201,
      json: async () => ({ data: authPayload }),
    });

    const gateway = new AuthRemoteGateway(
      fetchImpl as never,
      ((path: string) => `https://api.test${path}`) as never,
    );

    const result = await gateway.register({
      email: 'user@example.com',
      password: 'secret123',
      username: 'tester',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).toEqual({
      ok: true,
      status: 201,
      data: authPayload,
    });
  });

  it('posts refresh requests to the auth refresh endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'new-token', expiresIn: 3600 }),
    });

    const gateway = new AuthRemoteGateway(
      fetchImpl as never,
      ((path: string) => `https://api.test${path}`) as never,
    );

    const result = await gateway.refreshToken({
      refreshToken: 'refresh-token',
      sessionId: 'session-1',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { accessToken: 'new-token', expiresIn: 3600 },
    });
  });
});
