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

import type { IdentityId, DomainDate, TransferDate, PersistenceDate } from '../../../primitives';

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
