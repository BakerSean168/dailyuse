/**
 * OAuth 凭证 DTO (Server 端持有 Provider 信息)
 * 
 * Server 端实体接口已移至领域模型内部定义 (OAuthCredentialState)
 * 此处仅保留 DTO 定义
 */

import type { TransferDate } from '../../../primitives';
import type { BaseAuthCredentialServerDTO } from './base-auth-credential-server';
import { OAuthProvider } from '../value-objects/oauth-provider';

export interface OAuthCredentialServerDTO extends BaseAuthCredentialServerDTO {
  type: 'OAUTH';
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: TransferDate | null;
}
