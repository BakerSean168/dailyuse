/**
 * NotificationPreference Aggregate Root - Server Interface
 * 通知偏好聚合根 - 服务端接口
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type {
  NotificationChannelType,
} from '../value-objects';

import type { IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';

// ============ 实体接口 ============

/**
 * 管理用户的通知配置
 * 例如：Task 模块的消息，我希望 [桌面弹窗 + 邮件]
 * System 模块的消息，我只需要 [桌面弹窗]
 */
export interface NotificationPreferenceServer {
  // ===== 基础属性 =====
  id: string;
  identityId: IdentityId;

  // Key: 模块名; Value: 开启的渠道列表
  settings: Map<string, NotificationChannelType[]>;

  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * NotificationPreference Server DTO
 */
export interface NotificationPreferenceServerDTO {
  id: string;
  identityId: string;
  settings: Record<string, NotificationChannelType[]>; // 模块名 => 渠道列表
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * NotificationPreference Persistence DTO (数据库映射)
 */
export interface NotificationPreferencePersistenceDTO {
  id: string;
  identityId: string;
  settings: string; // JSON string - Record<string, NotificationChannelType[]>
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}

