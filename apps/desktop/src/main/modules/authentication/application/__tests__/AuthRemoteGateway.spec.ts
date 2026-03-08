import { describe, expect, it, vi } from 'vitest';

import { AuthRemoteGateway } from '../AuthRemoteGateway';

describe('AuthRemoteGateway', () => {
  it('posts registration requests to the auth register endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ identityId: 'user-1', accessToken: 'token' }),
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
      data: { identityId: 'user-1', accessToken: 'token' },
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
