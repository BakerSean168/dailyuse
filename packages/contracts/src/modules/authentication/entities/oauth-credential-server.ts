/**
 * OAuth 凭证 (Server 端持有 Provider 信息)
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { BaseAuthCredentialServer, BaseAuthCredentialServerDTO } from './base-auth-credential-server';
import { OAuthProvider } from '../value-objects/oauth-provider';

export interface OAuthCredentialServer extends BaseAuthCredentialServer {
  type: 'OAUTH';
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: DomainDate | null;
}

export interface OAuthCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'OAUTH';
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: TransferDate | null;
}


