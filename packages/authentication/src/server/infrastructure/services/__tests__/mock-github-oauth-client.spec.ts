import { describe, expect, it } from 'vitest';
import {
  MockGithubOAuthClient,
  buildMockGithubAuthorizeUrl,
  isMockGithubOAuthClientId,
} from '../mock-github-oauth-client';

describe('MockGithubOAuthClient', () => {
  it('recognizes e2e mock client ids', () => {
    expect(isMockGithubOAuthClientId('e2e-mock')).toBe(true);
    expect(isMockGithubOAuthClientId('mock')).toBe(true);
    expect(isMockGithubOAuthClientId('real-client')).toBe(false);
  });

  it('exchanges e2e-github codes for stable subjects', async () => {
    const client = new MockGithubOAuthClient();
    const identity = await client.exchangeCodeForIdentity({ code: 'e2e-github-42' });
    expect(identity.subjectId).toBe('42');
    expect(identity.email).toBe('e2e-42@example.test');
  });

  it('rejects non-mock codes', async () => {
    const client = new MockGithubOAuthClient();
    await expect(client.exchangeCodeForIdentity({ code: 'real-code' })).rejects.toThrow();
  });

  it('builds local callback authorize URLs without repo scopes', () => {
    const url = new URL(
      buildMockGithubAuthorizeUrl({
        redirectUri: 'http://127.0.0.1:5173/auth',
        state: 'state-1',
        subjectId: '99',
      }),
    );
    expect(url.searchParams.get('code')).toBe('e2e-github-99');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.toString()).not.toContain('repo');
  });
});
