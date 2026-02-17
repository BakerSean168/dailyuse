/**
 * AuthSession Aggregate Root - Client Interface
 * 会话聚合根 - 客户端接口
 *
 * Client 端看到的会话是脱敏的
 * - 不包含 Token 本体
 * - 显示用户友好的会话列表 (当前设备、其他设备)
 */

import type { AuthSessionId, DeviceInfo, IdentityId } from '../value-objects';
import type { TransferDate, DomainDate } from '@/primitives';

// ============ 聚合根接口 ============

/**
 * Client 端会话聚合根
 * 用于显示"当前登录设备"列表
 */
export interface AuthSessionClient {
  /**
   * 会话 ID
   */
  id: AuthSessionId;

  /**
   * 关联的身份 ID
   */
  identityId: IdentityId;

  /**
   * ✅ 设备信息 (用户可以看到的信息)
   */
  deviceInfo: DeviceInfo;

  /**
   * 创建时间
   */
  createdAt: DomainDate;

  /**
   * 过期时间
   */
  expiresAt: DomainDate;

  /**
   * 最后活跃时间
   */
  lastActiveAt: DomainDate;

  // 同步字段
  version: number;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface AuthSessionClientDTO {
  id: AuthSessionId;
  identityId: IdentityId;
  deviceInfo: DeviceInfo;
  isCurrentSession: boolean;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  expiresAt: TransferDate;
  lastActiveAt: TransferDate;
  deletedAt: TransferDate | null;
}
