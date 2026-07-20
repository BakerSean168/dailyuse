/**
 * Mock GitHub OAuth client for e2e / test lanes.
 * e2e / 测试车道用的 Mock GitHub OAuth 客户端。
 *
 * Authorization codes use the form `e2e-github-<subjectId>`. No network calls.
 * 授权码格式为 `e2e-github-<subjectId>`，无网络调用。
 */

import type {
  GithubUserIdentity,
  IGithubOAuthClient,
} from '../../domain/services/providers/i-github-oauth-client';

const CODE_PREFIX = 'e2e-github-';

export class MockGithubOAuthClient implements IGithubOAuthClient {
  async exchangeCodeForIdentity(params: {
    code: string;
    state?: string;
    redirectUri?: string;
    codeVerifier?: string;
  }): Promise<GithubUserIdentity> {
    void params.state;
    void params.redirectUri;
    void params.codeVerifier;

    if (!params.code.startsWith(CODE_PREFIX)) {
      throw new Error('Mock GitHub rejected authorization code');
    }
    const subjectId = params.code.slice(CODE_PREFIX.length).trim();
    if (!subjectId) {
      throw new Error('Mock GitHub code missing subject id');
    }
    const emailSubject =
      subjectId
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'user';
    return {
      subjectId,
      username: `e2e-${subjectId}`,
      email: `e2e-${emailSubject}@example.test`,
    };
  }
}

export function isMockGithubOAuthClientId(clientId: string | undefined): boolean {
  return clientId === 'e2e-mock' || clientId === 'mock';
}

export function buildMockGithubAuthorizeUrl(params: {
  redirectUri?: string;
  state: string;
  subjectId: string;
}): string {
  const code = `${CODE_PREFIX}${params.subjectId}`;
  // Prefer the caller redirect URI so browser/e2e land back on the product auth page.
  // 优先使用调用方 redirect URI，让浏览器/e2e 回到产品认证页。
  const base = params.redirectUri?.trim() || 'http://127.0.0.1/auth';
  const url = new URL(base);
  url.searchParams.set('code', code);
  url.searchParams.set('state', params.state);
  return url.toString();
}

export const MOCK_GITHUB_CODE_PREFIX = CODE_PREFIX;
