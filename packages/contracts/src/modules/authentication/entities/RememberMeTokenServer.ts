/**
 * RememberMeToken Entity - Server Interface
 * 记住我令牌实体 - 服务端接口
 */

import type { RememberMeTokenClientDTO } from './RememberMeTokenClient';

import type { DeviceInfoServer, DeviceInfoServerDTO } from '../value-objects/DeviceInfoServer';

// ============ DTO 定义 ============

/**
 * RememberMeToken Server DTO
 */
export interface RememberMeTokenServerDTO {
  uuid: string;
  credentialUuid: string;
  accountUuid: string;
  token: string; // hashed
  tokenSeries: string;
  device: DeviceInfoServerDTO;
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  usageCount: number;
  lastUsedAt?: number | null;
  lastUsedIp?: string | null;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  revokedAt?: number | null;
}

/**
 * RememberMeToken Persistence DTO
 */
export interface RememberMeTokenPersistenceDTO {
  uuid: string;
  credential_uuid: string;
  accountUuid: string;
  token: string;
  token_series: string;
  device: string; // JSON
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  usage_count: number;
  lastUsedAt?: number | null;
  last_used_ip?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date | null;
}

// ============ 实体接口 ============

export interface RememberMeTokenServer {
  uuid: string;
  credentialUuid: string;
  accountUuid: string;
  token: string;
  tokenSeries: string;
  device: DeviceInfoServer;
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  usageCount: number;
  lastUsedAt?: number | null;
  lastUsedIp?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date | null;

  verifyToken(plainToken: string): boolean;
  verifyDevice(deviceFingerprint: string): boolean;
  isExpired(): boolean;
  isValid(): boolean;
  recordUsage(ipAddress: string): void;
  markAsUsed(): void;
  revoke(): void;

  toServerDTO(): RememberMeTokenServerDTO;
  toClientDTO(): RememberMeTokenClientDTO;
  toPersistenceDTO(): RememberMeTokenPersistenceDTO;
}

export interface RememberMeTokenServerStatic {
  create(params: {
    credentialUuid: string;
    accountUuid: string;
    plainToken: string;
    tokenSeries: string;
    device: DeviceInfoServer;
    expiresInDays: number;
  }): RememberMeTokenServer;
  fromServerDTO(dto: RememberMeTokenServerDTO): RememberMeTokenServer;
  fromPersistenceDTO(dto: RememberMeTokenPersistenceDTO): RememberMeTokenServer;
}
