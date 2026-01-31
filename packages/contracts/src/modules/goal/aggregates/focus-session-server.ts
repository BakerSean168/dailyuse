/**
 * FocusSession Aggregate Root - Server Interface
 * 专注周期聚合根 - 服务端接口
 */

import type { IdentityId, FocusSessionId, GoalId, TransferDate, DomainDate, PersistenceDate } from '@/primitives';
import type { FocusSessionStatus } from '../value-objects/focus-session-status';

/**
 * FocusSession Server DTO
 * 服务端传输对象
 */
export interface FocusSessionServerDTO {
  id: string;
  identityId: string;
  goalId: string | null;
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

  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * FocusSession Persistence DTO (数据库映射)
 */
export interface FocusSessionPersistenceDTO {
  id: string;
  identityId: string;
  goalId: string | null;
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

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

/**
 * FocusSession Server Interface
 * 服务端接口
 */
export interface FocusSessionServer {
  // ===== 属性 =====
  id: FocusSessionId;
  identityId: IdentityId;
  goalId: GoalId | null;
  status: FocusSessionStatus;
  durationMinutes: number;
  actualDurationMinutes: number;
  description: string | null;

  startedAt: DomainDate | null;
  pausedAt: DomainDate | null;
  resumedAt: DomainDate | null;
  completedAt: DomainDate | null;
  cancelledAt: DomainDate | null;

  pauseCount: number;
  pausedDurationMinutes: number;

  createdAt: DomainDate;
  updatedAt: DomainDate;
}
