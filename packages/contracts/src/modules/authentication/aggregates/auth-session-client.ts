/**
 * AuthSession Entity - Client Interface
 * 会话实体 - 客户端接口
 */

import type { DeviceInfo } from '../value-objects/device-info';

import type { SessionId } from '../value-objects/auth-session-id';
import type { IdentityId } from '../value-objects/identity-id';
import { SessionStatus } from '../value-objects/session-status';
import type { DomainDate } from '@/primitives/domain-date';
import type { TransferDate } from '@/primitives';


// ============ 实体接口 ============

export interface AuthSessionClient {
  // --- State ---
  // SessionId 即 Refresh Token
  readonly id: SessionId;
  // 仅引用 ID，不持有对象 (Lazy Loading)
  readonly identityId: IdentityId;
  readonly isCurrent: boolean;
  
  readonly deviceInfo: DeviceInfo;
  
  readonly createdAt: DomainDate;
  expiresAt: DomainDate;         // 绝对过期时间
  lastRefreshedAt: DomainDate;   // 滑动窗口用
  
  status: SessionStatus;

  // --- Behaviors ---

  /**
   * 行为：判断是否可以被撤销
   * (比如：也许策略上不允许撤销本机，或者 Admin 才能撤销)
   */
  canBeRevoked(): boolean;
}

export interface AuthSessionClientStatic {
  fromClientDTO(dto: AuthSessionClientDTO): AuthSessionClient;
}


// ============ DTO 定义 ============

/**
 * AuthSession Client DTO
 */
export interface AuthSessionClientDTO {
  id: string;
  identityId: string;
  isCurrent: boolean;
  deviceInfo: DeviceInfo;
  createdAt: TransferDate;
  expiresAt: TransferDate;
  lastRefreshedAt: TransferDate;
  status: SessionStatus;
}

