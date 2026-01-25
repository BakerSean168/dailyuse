/**
 * RememberMeToken Entity - Client Interface
 * 记住我令牌实体 - 客户端接口
 */

import type { DeviceInfoClient, DeviceInfoClientDTO } from '../value-objects/DeviceInfoClient';

// ============ DTO 定义 ============

/**
 * RememberMeToken Client DTO
 */
export interface RememberMeTokenClientDTO {
  uuid: string;
  credentialUuid: string;
  accountUuid: string;
  tokenSeries: string;
  device: DeviceInfoClientDTO;
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  usageCount: number;
  lastUsedAt?: number | null;
  lastUsedIp?: string | null;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  revokedAt?: number | null;
}

// ============ 实体接口 ============

export interface RememberMeTokenClient {
  uuid: string;
  credentialUuid: string;
  accountUuid: string;
  tokenSeries: string;
  device: DeviceInfoClient;
  status: 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';
  usageCount: number;
  lastUsedAt?: number | null;
  lastUsedIp?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date | null;

  toClientDTO(): RememberMeTokenClientDTO;
}

export interface RememberMeTokenClientStatic {
  fromClientDTO(dto: RememberMeTokenClientDTO): RememberMeTokenClient;
}
