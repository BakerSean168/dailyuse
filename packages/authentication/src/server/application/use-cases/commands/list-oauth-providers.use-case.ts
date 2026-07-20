/**
 * List OAuth providers availability for UI gating.
 * 列出 OAuth 提供者可用性，供 UI 门控（不签发 state/PKCE）。
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { OAuthProvidersRes } from '@dailyuse/contracts/authentication';
import type { GithubOAuthAuthorizeConfig } from './get-oauth-url.use-case';

export class ListOAuthProvidersUseCase {
  constructor(private readonly github?: GithubOAuthAuthorizeConfig) {}

  async execute(): Promise<Result<OAuthProvidersRes>> {
    return ok({
      providers: [
        {
          provider: 'Github',
          enabled: Boolean(this.github?.clientId),
        },
        { provider: 'Google', enabled: false },
        { provider: 'Microsoft', enabled: false },
        { provider: 'Apple', enabled: false },
      ],
    });
  }
}
