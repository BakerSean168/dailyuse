/**
 * FocusSession Aggregate Root - Client Interface
 * 专注周期聚合根 - 客户端接口
 */

import type { FocusSessionStatus } from '../enums';
import type { FocusSessionServerDTO } from './FocusSessionServer';

/**
 * FocusSession Client DTO
 * 客户端传输对象
 */
export interface FocusSessionClientDTO {
  uuid: string;
  accountUuid: string;
  goalUuid: string | null;
  status: FocusSessionStatus;
  durationMinutes: number; // 计划时长（分钟）
  actualDurationMinutes: number; // 实际时长（分钟）
  description: string | null;

  // 时间记录
  startedAt: number | null; // timestamp (ms)
  pausedAt: number | null; // timestamp (ms)
  resumedAt: number | null; // timestamp (ms)
  completedAt: number | null; // timestamp (ms)
  cancelledAt: number | null; // timestamp (ms)

  // 暂停统计
  pauseCount: number; // 暂停次数
  pausedDurationMinutes: number; // 累计暂停时长（分钟）

  // 计算属性（前端使用）
  remainingMinutes?: number; // 剩余时间（分钟）
  progressPercentage?: number; // 进度百分比（0-100）
  isActive?: boolean; // 是否活跃（进行中或暂停）

  createdAt: number; // timestamp (ms)
  updatedAt: number; // timestamp (ms)
}

/**
 * FocusSession Client Interface
 * 客户端接口
 */
export interface FocusSessionClient {
  // ===== 属性 =====
  readonly uuid: string;
  readonly accountUuid: string;
  readonly goalUuid: string | null;
  readonly status: FocusSessionStatus;
  readonly durationMinutes: number;
  readonly actualDurationMinutes: number;
  readonly description: string | null;

  readonly startedAt: Date | null;
  readonly pausedAt: number | null;
  readonly resumedAt: number | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: number | null;

  readonly pauseCount: number;
  readonly pausedDurationMinutes: number;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ===== DTO 转换方法 =====
  toClientDTO(): FocusSessionClientDTO;
  toServerDTO(): FocusSessionServerDTO;
}
