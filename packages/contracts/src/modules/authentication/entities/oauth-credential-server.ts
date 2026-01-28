/**
 * 第三方 OAuth 凭证的服务端定义文件
 */

import type { BaseCredential } from "../types/base-credential";
import type { CredentialType } from "../value-objects/auth-credential-type";

export interface OAuthCredential extends BaseCredential {
  readonly type: CredentialType.OAUTH2;
  
  readonly provider: 'GOOGLE' | 'GITHUB' | 'WECHAT';
  readonly externalUserId: string; // 第三方的 OpenID
  
  // 第三方令牌 (可选，如果不需持久化可不存)
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}