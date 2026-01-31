/**
 * Goal Time Range Value Object
 * 目标时间范围值对象
 */

// ============ 接口定义 ============

/**
 * 目标时间范围 - Server 接口
 */
export interface IGoalTimeRangeServer {
  startDate?: number | null; // epoch ms
  targetDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  archivedAt?: number | null; // epoch ms

  // 值对象方法
  equals(other: IGoalTimeRangeServer): boolean;
  with(
    updates: Partial<
      Omit<
        IGoalTimeRangeServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IGoalTimeRangeServer;

  // 业务方法
  isOverdue(): boolean; // 是否逾期（当前时间 > targetDate）
  getDurationDays(): number | null; // 获取持续天数（startDate 到 targetDate）
  getRemainingDays(): number | null; // 获取剩余天数（当前到 targetDate）
  isWithinTimeRange(timestamp: number): boolean; // 时间戳是否在范围内

  // DTO 转换方法}

/**
 * 目标时间范围 - Client 接口
 */
export interface IGoalTimeRangeClient {
  startDate?: number | null;
  targetDate?: number | null;
  completedAt?: number | null;
  archivedAt?: number | null;

  // UI 辅助属性
  startDateFormatted?: string | null; // "2025-01-01"
  targetDateFormatted?: string | null; // "2025-12-31"
  completedAtFormatted?: string | null; // "2025-10-14"
  archivedAtFormatted?: string | null; // "2025-10-14"
  dateRangeText: string; // "2025-01-01 至 2025-12-31" 或 "未设置时间"
  durationText?: string | null; // "持续 365 天"
  remainingText?: string | null; // "剩余 78 天" / "已逾期 5 天"
  isOverdue: boolean;
  progressPercentage?: number | null; // 时间进度百分比

  // 值对象方法
  equals(other: IGoalTimeRangeClient): boolean;

  // DTO 转换方法}

// ============ DTO 定义 ============

/**
 * Goal Time Range Server DTO
 */
export interface GoalTimeRangeServerDTO {
  startDate?: number | null; // epoch ms
  targetDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  archivedAt?: number | null; // epoch ms
}

/**
 * Goal Time Range Client DTO
 */
export interface GoalTimeRangeClientDTO {
  startDate?: number | null;
  targetDate?: number | null;
  completedAt?: number | null;
  archivedAt?: number | null;
  startDateFormatted?: string | null;
  targetDateFormatted?: string | null;
  completedAtFormatted?: string | null;
  archivedAtFormatted?: string | null;
  dateRangeText: string;
  durationText?: string | null;
  remainingText?: string | null;
  isOverdue: boolean;
  progressPercentage?: number | null;
}

/**
 * Goal Time Range Persistence DTO
 */
export interface GoalTimeRangePersistenceDTO {
  startDate?: number | null;
  targetDate?: number | null;
  completedAt?: number | null;
  archivedAt?: number | null;
}

// ============ 类型导出 ============

export type GoalTimeRangeServer = IGoalTimeRangeServer;
export type GoalTimeRangeClient = IGoalTimeRangeClient;
