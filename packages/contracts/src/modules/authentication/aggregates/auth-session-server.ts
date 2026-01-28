/**
 * AuthSession Entity - Server Interface
 * 会话实体 - 服务端接口
 */


import type { DeviceInfo } from '../value-objects/device-info';
import type { AuthSessionClientDTO } from './auth-session-client';

import type { SessionId } from '../value-objects/auth-session-id';
import type { IdentityId } from '../value-objects/identity-id';
import { SessionStatus } from '../value-objects/session-status';
import type { DomainDate } from '@/primitives/domain-date';
import type { TransferDate } from '@/primitives';
import type { PersistenceDate } from '@/primitives';

// ============ 实体接口 ============

export interface AuthSessionServer {
  // --- State ---
    // SessionId 即 Refresh Token
    readonly id: SessionId;
    
    // 仅引用 ID，不持有对象 (Lazy Loading)
    readonly identityId: IdentityId;
  
    
    readonly deviceInfo: DeviceInfo;
    
    readonly createdAt: DomainDate;
    expiresAt: DomainDate;         // 绝对过期时间
    lastRefreshedAt: DomainDate;   // 滑动窗口用
    
    status: SessionStatus;
  
    // --- Behaviors ---
  
    /**
     * 续期 (Refresh Token)
     * 1. 检查是否 Revoked -> 抛错
     * 2. 检查是否 Expired -> 抛错
     * 3. 延长 expiresAt
     */
    refresh(extensionSeconds: number): void;
  
    /**
     * 撤销/踢下线
     * 1. status = REVOKED
     * 2. 发出 SessionRevokedEvent
     */
    revoke(): void;
  
    /**
     * 校验有效性 (Getter)
     */
    isValid(): boolean;
  

    toServerDTO(): AuthSessionServerDTO;
    toClientDTO(): AuthSessionClientDTO;
    toPersistenceDTO(): AuthSessionPersistenceDTO;
}

export interface AuthSessionServerStatic {
  fromPersistenceDTO(dto: AuthSessionPersistenceDTO): AuthSessionServer;
}

// ============ DTO 定义 ============

/**
 * AuthSession Server DTO
 */
export interface AuthSessionServerDTO {
  id: string;
  identityId: string;
  deviceInfo: DeviceInfo;
  createdAt: TransferDate;
  expiresAt: TransferDate;
  lastRefreshedAt: TransferDate;
  status: SessionStatus;
}

/**
 * AuthSession Persistence DTO
 */
export interface AuthSessionPersistenceDTO {
  id: string;
  identityId: string;
  deviceInfo: DeviceInfo;
  createdAt: PersistenceDate;
  expiresAt: PersistenceDate;
  lastRefreshedAt: PersistenceDate;
  status: SessionStatus;
}