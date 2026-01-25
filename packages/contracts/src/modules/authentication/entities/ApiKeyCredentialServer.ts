/**
 * ApiKeyCredential Entity - Server Interface
 * API密钥凭证实体 - 服务端接口
 */

import type { ApiKeyCredentialClient, ApiKeyCredentialClientDTO } from './ApiKeyCredentialClient';

// ============ DTO 定义 ============

/**
 * ApiKeyCredential Server DTO
 */
export interface ApiKeyCredentialServerDTO {
  uuid: string;
  credentialUuid: string;
  name: string;
  key: string; // hashed
  keyPrefix: string; // first 8 chars for display
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: number | null;
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * ApiKeyCredential Persistence DTO
 */
export interface ApiKeyCredentialPersistenceDTO {
  uuid: string;
  credential_uuid: string;
  name: string;
  key: string;
  key_prefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: number | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

export interface ApiKeyCredentialServer {
  uuid: string;
  credentialUuid: string;
  name: string;
  key: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: number | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  isExpired(): boolean;
  isValid(): boolean;
  revoke(): void;
  recordUsage(): void;

  toServerDTO(): ApiKeyCredentialServerDTO;
  toClientDTO(): ApiKeyCredentialClientDTO;
  toPersistenceDTO(): ApiKeyCredentialPersistenceDTO;
}

export interface ApiKeyCredentialServerStatic {
  create(params: {
    credentialUuid: string;
    name: string;
    key: string;
    keyPrefix: string;
    expiresInDays?: number;
  }): ApiKeyCredentialServer;
  fromServerDTO(dto: ApiKeyCredentialServerDTO): ApiKeyCredentialServer;
  fromPersistenceDTO(dto: ApiKeyCredentialPersistenceDTO): ApiKeyCredentialServer;
}
