/**
 * GithubOAuthClient tests — verify code→identity exchange with injected fetch.
 * 验证注入 fetch 下的 授权码→身份 交换流程。
 */
import { describe, it, expect, vi } from 'vitest';
import { GithubOAuthClient } from '../github-oauth-client';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('GithubOAuthClient', () => {
  it('requires clientId and clientSecret', () => {
    expect(() => new GithubOAuthClient({ clientId: '', clientSecret: 'x' })).toThrow();
    expect(() => new GithubOAuthClient({ clientId: 'x', clientSecret: '' })).toThrow();
  });

  it('exchanges an authorization code for a stable GitHub identity', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'gho_token' }))
      .mockResolvedValueOnce(
        jsonResponse({ id: 4242, login: 'octocat', email: 'octo@example.com' }),
      ) as unknown as typeof fetch;

    const client = new GithubOAuthClient({
      clientId: 'cid',
      clientSecret: 'secret',
      fetchImpl,
    });

    const identity = await client.exchangeCodeForIdentity({ code: 'abc', state: 's' });

    expect(identity.subjectId).toBe('4242');
    expect(identity.username).toBe('octocat');
    expect(identity.email).toBe('octo@example.com');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('uses the GitHub numeric id (not username) as the stable subject', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 't' }))
      .mockResolvedValueOnce(jsonResponse({ id: 1, login: 'renamed-user' }))
      .mockResolvedValueOnce(
        jsonResponse([{ email: 'verified@example.com', primary: true, verified: true }]),
      ) as unknown as typeof fetch;

    const client = new GithubOAuthClient({ clientId: 'c', clientSecret: 's', fetchImpl });
    const identity = await client.exchangeCodeForIdentity({ code: 'x' });

    expect(identity.subjectId).toBe('1');
    expect(identity.email).toBe('verified@example.com');
  });

  it('falls back to the first verified email when the public profile email is hidden', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 't' }))
      .mockResolvedValueOnce(jsonResponse({ id: 2, login: 'hidden-email', email: null }))
      .mockResolvedValueOnce(
        jsonResponse([
          { email: 'unverified@example.com', primary: true, verified: false },
          { email: 'verified@example.com', primary: false, verified: true },
        ]),
      ) as unknown as typeof fetch;
    const client = new GithubOAuthClient({ clientId: 'c', clientSecret: 's', fetchImpl });

    const identity = await client.exchangeCodeForIdentity({ code: 'x' });

    expect(identity.email).toBe('verified@example.com');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('throws when the token exchange is rejected', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: 'bad_verification_code' }),
      ) as unknown as typeof fetch;

    const client = new GithubOAuthClient({ clientId: 'c', clientSecret: 's', fetchImpl });

    await expect(client.exchangeCodeForIdentity({ code: 'bad' })).rejects.toThrow(
      /token exchange rejected/,
    );
  });

  it('throws when the user response has no stable id', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 't' }))
      .mockResolvedValueOnce(jsonResponse({ login: 'no-id' })) as unknown as typeof fetch;

    const client = new GithubOAuthClient({ clientId: 'c', clientSecret: 's', fetchImpl });

    await expect(client.exchangeCodeForIdentity({ code: 'x' })).rejects.toThrow(
      /missing stable id/,
    );
  });

  it('never sends the client secret to the browser-visible user endpoint', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn((url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(
        calls.length === 1
          ? jsonResponse({ access_token: 't' })
          : jsonResponse({ id: 9, login: 'u', email: 'u@example.com' }),
      );
    }) as unknown as typeof fetch;

    const client = new GithubOAuthClient({ clientId: 'c', clientSecret: 'topsecret', fetchImpl });
    await client.exchangeCodeForIdentity({ code: 'x' });

    // Secret only appears in the token POST body, not the user GET request.
    expect(calls[1].init?.body).toBeUndefined();
    const userHeaders = calls[1].init?.headers as Record<string, string>;
    expect(JSON.stringify(userHeaders)).not.toContain('topsecret');
  });
});
