/**
 * Get OAuth URL Use Case
 *
 * Issues state + PKCE and returns a provider authorize URL (GitHub only for now).
 * 签发 state + PKCE，并返回提供者授权 URL（当前仅 GitHub）。
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { GetOAuthUrlReq, GetOAuthUrlRes } from '@dailyuse/contracts/authentication';
import type { InMemoryOAuthStateStore } from '../../../infrastructure/services/in-memory-oauth-state-store';

export interface GithubOAuthAuthorizeConfig {
  readonly clientId: string;
  readonly authorizeUrl?: string;
  readonly scopes?: readonly string[];
}

export class GetOAuthUrlUseCase {
  constructor(
    private readonly stateStore: InMemoryOAuthStateStore,
    private readonly github?: GithubOAuthAuthorizeConfig,
  ) {}

  async execute(input: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    if (input.provider !== 'Github') {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: `OAuth provider is not enabled: ${input.provider}`,
      });
    }
    if (!this.github?.clientId) {
      return fail({
        code: 'SERVICE_UNAVAILABLE',
        message: 'GitHub OAuth is not configured',
      });
    }

    const issued = this.stateStore.issue({
      provider: input.provider,
      redirectUri: input.redirectUri,
    });

    const authorizeBase = this.github.authorizeUrl ?? 'https://github.com/login/oauth/authorize';
    // Identity-only scopes (ADR-034). Never request repo Contents here.
    const scopes = (this.github.scopes ?? ['read:user', 'user:email']).join(' ');
    const url = new URL(authorizeBase);
    url.searchParams.set('client_id', this.github.clientId);
    url.searchParams.set('state', issued.state);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('code_challenge', issued.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (input.redirectUri) {
      url.searchParams.set('redirect_uri', input.redirectUri);
    }

    return ok({
      authUrl: url.toString(),
      state: issued.state,
    });
  }
}
