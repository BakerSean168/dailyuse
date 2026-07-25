/**
 * Residual 991: sole toDomainProvider helper for bind/unbind OAuth use cases.
 * BindOAuth + UnbindOAuth import this; local duals retired.
 * Soft residual 893: transport OAuthProvider allows Microsoft; domain/VO catalog does not —
 * Microsoft (and any unknown transport member) maps to null.
 */

import type { BindOAuthReq } from '@dailyuse/contracts/authentication';
import { OAuthProvider } from '../domain';

export function toDomainProvider(provider: BindOAuthReq['provider']): OAuthProvider | null {
  switch (provider) {
    case 'Github':
      return OAuthProvider.Github;
    case 'Google':
      return OAuthProvider.Google;
    case 'Apple':
      return OAuthProvider.Apple;
    default:
      // Residual 893: transport allows Microsoft; domain/VO catalog does not — treat as unavailable.
      return null;
  }
}
