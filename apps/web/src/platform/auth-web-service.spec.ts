import { afterEach, describe, expect, it, vi } from 'vitest';
import { authWebService } from './auth-web-service';

describe('authWebService error contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves stable result error codes from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: 'RATE_LIMITED', message: 'internal raw message' },
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await authWebService.loginByEmail({
      email: 'person@example.com',
      password: 'Test123456!',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'RATE_LIMITED' } });
  });

  it('normalizes transport failures to a stable network code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await authWebService.loginByEmail({
      email: 'person@example.com',
      password: 'Test123456!',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'NETWORK_ERROR' } });
  });
});
