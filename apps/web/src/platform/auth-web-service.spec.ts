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

  it('posts forgot password requests to the recovery endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await authWebService.forgotPassword({ email: 'person@example.com' });

    expect(result).toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/password/forgot',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('posts email verification codes to the email endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await authWebService.sendEmailCode({ email: 'person@example.com', purpose: 'EmailVerify' });
    await authWebService.verifyEmailCode({
      email: 'person@example.com',
      code: '123456',
      purpose: 'EmailVerify',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/auth/email/send-code',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/auth/email/verify',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
