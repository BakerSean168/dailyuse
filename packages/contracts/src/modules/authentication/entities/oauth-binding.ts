/**
 * OAuthBinding - OAuth 绑定 DTO
 * 
 * 实体形式的标识符：拥有独立 ID，token 状态可变
 * 语义上归入 Identifier 集合（用于"查找用户"），而非 Credential（用于"验证用户"）
 */

import type { DomainDate, TransferDate } from '@/primitives';
import type { OAuthProvider } from '../value-objects/oauth-provider';

// ============ OAuthBinding 接口 ============

export interface OAuthBindingServer {
  id: string;
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: DomainDate | null;
  createdAt: DomainDate;
  lastUsedAt: DomainDate | null;
}

// ============ OAuthBinding DTO ============

export interface OAuthBindingServerDTO {
  id: string;
  provider: OAuthProvider;
  providerSubjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: TransferDate | null;
  createdAt: TransferDate;
  lastUsedAt: TransferDate | null;
}

