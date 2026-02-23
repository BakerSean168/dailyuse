/**
 * FocusSession Aggregate Root - Server Interface
 * 专注周期聚合根 - 服务端接口
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type { IdentityId, FocusSessionId, GoalId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { FocusSessionStatus } from '../value-objects/focus-session-status';

/**
 * FocusSession Server DTO
 * 服务端传输对象
 */
export interface FocusSessionServerDTO {
  id: FocusSessionId;
  identityId: IdentityId;
  goalId: GoalId | null;
  status: FocusSessionStatus;
  durationMinutes: number; // 计划时长（分钟）
  actualDurationMinutes: number; // 实际时长（分钟）
  description: string | null;

  // 时间记录
  startedAt: TransferDate | null;
  pausedAt: TransferDate | null;
  resumedAt: TransferDate | null;
  completedAt: TransferDate | null;
  cancelledAt: TransferDate | null;

  // 暂停统计
  pauseCount: number; // 暂停次数
  pausedDurationMinutes: number; // 累计暂停时长（分钟）

  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * FocusSession Persistence DTO (数据库映射)
 */
export interface FocusSessionPersistenceDTO {
  id: FocusSessionId;
  identityId: IdentityId;
  goalId: GoalId | null;
  status: string;
  durationMinutes: number;
  actualDurationMinutes: number;
  description: string | null;

  startedAt: PersistenceDate | null;
  pausedAt: PersistenceDate | null;
  resumedAt: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  cancelledAt: PersistenceDate | null;
  pauseCount: number;
  pausedDurationMinutes: number;

  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}
