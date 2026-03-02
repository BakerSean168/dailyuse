/**
 * FocusSession Aggregate Root - Client Interface
 * 专注周期聚合根 - 客户端接口
 */

import type { IdentityId, FocusSessionId, GoalId, TransferDate, DomainDate } from '../../../primitives';
import type { FocusSessionStatus } from '../value-objects/focus-session-status';
import type { FocusSessionServerDTO } from './focus-session-server';

/**
 * FocusSession Client DTO
 * 客户端传输对象
 */
export interface FocusSessionClientDTO {
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

  // 计算属性（前端使用）
  remainingMinutes?: number; // 剩余时间（分钟）
  progressPercentage?: number; // 进度百分比（0-100）
  isActive?: boolean; // 是否活跃（进行中或暂停）

  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
