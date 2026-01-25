/**
 * FocusSession Aggregate Root - Server Interface
 * 专注周期聚合根 - 服务端接口
 */

import type { FocusSessionStatus } from '../enums';

/**
 * FocusSession Server DTO
 * 服务端传输对象
 */
export interface FocusSessionServerDTO {
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

  createdAt: number; // timestamp (ms)
  updatedAt: number; // timestamp (ms)
}

/**
 * FocusSession Persistence DTO (数据库映射)
 */
export interface FocusSessionPersistenceDTO {
  uuid: string;
  accountUuid: string;
  goalUuid: string | null;
  status: string;
  durationMinutes: number;
  actualDurationMinutes: number;
  description: string | null;

  startedAt: Date | null;
  pausedAt: number | null;
  resumedAt: number | null;
  completedAt: Date | null;
  cancelledAt: number | null;
  pauseCount: number;
  pausedDurationMinutes: number;

  createdAt: Date; // timestamp (ms)
  updatedAt: Date; // timestamp (ms)
}

/**
 * FocusSession Server Interface
 * 服务端接口
 */
export interface FocusSessionServer {
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

  // ===== 业务方法 =====
  /**
   * 开始专注周期
   */
  start(): void;

  /**
   * 暂停专注周期
   */
  pause(): void;

  /**
   * 恢复专注周期
   */
  resume(): void;

  /**
   * 完成专注周期
   */
  complete(): void;

  /**
   * 取消专注周期
   */
  cancel(): void;

  /**
   * 检查是否处于活跃状态（进行中或暂停）
   */
  isActive(): boolean;

  /**
   * 获取剩余时间（分钟）
   */
  getRemainingMinutes(): number;

  // ===== DTO 转换方法 =====
  toServerDTO(): FocusSessionServerDTO;
  toPersistenceDTO(): FocusSessionPersistenceDTO;
}

// ============ 领域事件定义 ============

/**
 * 专注周期开始事件
 */
export interface FocusSessionStartedEvent {
  type: 'focus_session.started';
  aggregateId: string; // sessionUuid
  occurredOn: number; // timestamp (ms)
  payload: {
    sessionUuid: string;
    accountUuid: string;
    goalUuid: string | null;
    durationMinutes: number;
    startedAt: Date;
  };
}

/**
 * 专注周期暂停事件
 */
export interface FocusSessionPausedEvent {
  type: 'focus_session.paused';
  aggregateId: string; // sessionUuid
  occurredOn: number;
  payload: {
    sessionUuid: string;
    accountUuid: string;
    pausedAt: number;
    pauseCount: number;
  };
}

/**
 * 专注周期恢复事件
 */
export interface FocusSessionResumedEvent {
  type: 'focus_session.resumed';
  aggregateId: string; // sessionUuid
  occurredOn: number;
  payload: {
    sessionUuid: string;
    accountUuid: string;
    resumedAt: number;
    pausedDurationMinutes: number; // 累计暂停时长
  };
}

/**
 * 专注周期完成事件
 */
export interface FocusSessionCompletedEvent {
  type: 'focus_session.completed';
  aggregateId: string; // sessionUuid
  occurredOn: number;
  payload: {
    sessionUuid: string;
    accountUuid: string;
    goalUuid: string | null;
    completedAt: Date;
    actualDurationMinutes: number;
    plannedDurationMinutes: number;
  };
}

/**
 * 专注周期取消事件
 */
export interface FocusSessionCancelledEvent {
  type: 'focus_session.cancelled';
  aggregateId: string; // sessionUuid
  occurredOn: number;
  payload: {
    sessionUuid: string;
    accountUuid: string;
    cancelledAt: number;
    reason?: string | null;
  };
}
