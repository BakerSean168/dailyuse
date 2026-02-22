/**
 * AuthSession Aggregate Root - Server Interface
 * 会话聚合根 - 服务端接口
 *
 * 核心职责:
 * 1. 管理用户会话生命周期
 * 2. 支持多设备并发会话
 * 3. 实现会话续期和撤销逻辑
 */

import type { DeviceInfo } from '../value-objects/device-info';
import type { AuthSessionClientDTO } from './auth-session-client';

import type { AuthSessionId } from '../value-objects/auth-session-id';
import type { IdentityId } from '../value-objects/identity-id';
import { SessionStatus } from '../value-objects/session-status';
import type { DomainDate } from '@/primitives';
import type { TransferDate } from '@/primitives';

// ============ 聚合根接口 ============

/**
 * Server 端会话聚合根
 * 持有完整的会话数据和敏感信息
 */
export interface AuthSessionServer {
  /**
   * 会话 ID (强类型)
   * 通常作为 Refresh Token 的 JTI (JWT ID)
   */
  id: AuthSessionId;

  /**
   * 关联的身份 ID
   * 引用关系: Session -> Identity
   */
  identityId: IdentityId;

  /**
   * ✅ 设备信息 (包含指纹、IP、User-Agent 等)
   */
  deviceInfo: DeviceInfo;

  /**
   * 刷新令牌哈希 (如果支持刷新)
   */
  refreshTokenHash?: string;

  /**
   * 会话状态
   */
  status: SessionStatus;

  /**
   * 创建时间
   */
  createdAt: DomainDate;

  /**
   * 过期时间 (绝对过期)
   */
  expiresAt: DomainDate;

  /**
   * 最后活跃时间 (用于滑动窗口)
   */
  lastActiveAt: DomainDate;

  /**
   * 是否被撤销
   */
  isRevoked: boolean;
}

// ============ DTO 定义 ============

/**
 * Server DTO (内部构造用)
 * 使用 TransferDate (number) 时间戳
 */
export interface AuthSessionServerDTO {
  id: AuthSessionId;
  identityId: IdentityId;
  deviceInfo: DeviceInfo;
  refreshTokenHash?: string;
  status: SessionStatus;
  createdAt: TransferDate;
  expiresAt: TransferDate;
  lastActiveAt: TransferDate;
  isRevoked: boolean;
}


