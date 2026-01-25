/**
 * AuthSession Entity - Client Interface
 * 会话实体 - 客户端接口
 */

import type { RefreshTokenClient } from '../entities/RefreshTokenClient';
import type { DeviceInfoClient } from '../value-objects/DeviceInfoClient';
import type { SessionHistoryClient } from '../entities/SessionHistoryClient';

// ============ DTO 定义 ============

/**
 * AuthSession Client DTO
 */
export interface AuthSessionClientDTO {
  uuid: string;
  accountUuid: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: RefreshTokenClient;
  device: DeviceInfoClient;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  lastActivityAt: number;
  lastActivityType?: string | null;
  history: SessionHistoryClient[];
  createdAt: number;
  expiresAt: number;
  revokedAt?: number | null;
}

// ============ 实体接口 ============

export interface AuthSessionClient {
  uuid: string;
  accountUuid: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: RefreshTokenClient;
  device: DeviceInfoClient;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED';
  ipAddress: string;
  location?: {
    country?: string | null;
    region?: string | null;
    city?: string | null;
    timezone?: string | null;
  } | null;
  lastActivityAt: Date;
  lastActivityType?: string | null;
  history: SessionHistoryClient[];
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;

  toClientDTO(): AuthSessionClientDTO;
}

export interface AuthSessionClientStatic {
  fromClientDTO(dto: AuthSessionClientDTO): AuthSessionClient;
}
