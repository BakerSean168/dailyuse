/**
 * GitHub OAuth Client — GitHub App user-authorization client.
 * GitHub OAuth 客户端 —— GitHub App 用户授权客户端。
 *
 * Concrete infrastructure adapter implementing the domain-level
 * IGithubOAuthClient port. It exchanges an authorization code for a stable
 * GitHub identity, requesting ONLY identity information (ADR-034):
 * - no repository Contents permission is requested here;
 * - repository connection is a separate, explicit authorization flow.
 *
 * 具体基础设施适配器，实现领域级 IGithubOAuthClient 端口。它用授权码换取稳定的
 * GitHub 身份，且只请求身份信息（ADR-034）：此处不申请仓库 Contents 权限；
 * 仓库连接是独立、明确的授权流程。
 *
 * Security:
 * - client secret stays server-side and is never logged or returned;
 * - the stable key is the GitHub numeric user id, not the mutable username.
 * 安全：client secret 仅存于服务端，不记录、不返回；稳定主键是 GitHub 数字
 * user id，而非可变用户名。
 */

import type {
  GithubUserIdentity,
  IGithubOAuthClient,
} from '../../domain/services/providers/i-github-oauth-client';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('GithubOAuthClient');

const DEFAULT_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const DEFAULT_USER_URL = 'https://api.github.com/user';

export interface GithubOAuthClientConfig {
  /** GitHub App / OAuth client id. */
  readonly clientId: string;
  /** GitHub App / OAuth client secret (server-side only). */
  readonly clientSecret: string;
  /** Override the token endpoint (tests / GitHub Enterprise). */
  readonly tokenUrl?: string;
  /** Override the user endpoint (tests / GitHub Enterprise). */
  readonly userUrl?: string;
  /**
   * Injected fetch implementation, for testing without real network.
   * 注入的 fetch 实现，便于无网络测试。
   */
  readonly fetchImpl?: typeof fetch;
}

interface GithubAccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GithubUserResponse {
  id?: number;
  login?: string;
  email?: string | null;
}

export class GithubOAuthClient implements IGithubOAuthClient {
  private readonly tokenUrl: string;
  private readonly userUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: GithubOAuthClientConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('GithubOAuthClient requires clientId and clientSecret');
    }
    this.tokenUrl = config.tokenUrl ?? DEFAULT_TOKEN_URL;
    this.userUrl = config.userUrl ?? DEFAULT_USER_URL;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async exchangeCodeForIdentity(params: {
    code: string;
    state?: string;
    redirectUri?: string;
  }): Promise<GithubUserIdentity> {
    // 1. Exchange authorization code for a user access token.
    const accessToken = await this.exchangeCode(params);

    // 2. Fetch the authenticated user's stable identity.
    return this.fetchIdentity(accessToken);
  }

  private async exchangeCode(params: {
    code: string;
    state?: string;
    redirectUri?: string;
  }): Promise<string> {
    const body: Record<string, string> = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: params.code,
    };
    if (params.redirectUri) {
      body.redirect_uri = params.redirectUri;
    }
    if (params.state) {
      body.state = params.state;
    }

    const response = await this.fetchImpl(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      logger.error('[GitHub] token exchange failed', { status: response.status });
      throw new Error('GitHub token exchange failed');
    }

    const data = (await response.json()) as GithubAccessTokenResponse;
    if (data.error || !data.access_token) {
      // Never log the error_description verbatim if it might carry sensitive echo.
      logger.error('[GitHub] token exchange rejected', { error: data.error });
      throw new Error('GitHub token exchange rejected');
    }

    return data.access_token;
  }

  private async fetchIdentity(accessToken: string): Promise<GithubUserIdentity> {
    const response = await this.fetchImpl(this.userUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      logger.error('[GitHub] user fetch failed', { status: response.status });
      throw new Error('GitHub user fetch failed');
    }

    const user = (await response.json()) as GithubUserResponse;
    if (typeof user.id !== 'number') {
      throw new Error('GitHub user response missing stable id');
    }

    return {
      // GitHub numeric user id is the stable OAuth subject.
      subjectId: String(user.id),
      username: user.login,
      email: user.email ?? null,
    };
  }
}
