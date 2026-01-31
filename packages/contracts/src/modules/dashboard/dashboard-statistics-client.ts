/**
 * Dashboard 统计数据传输对象
 * Dashboard Statistics Data Transfer Objects
 *
 * @description
 * 聚合 Task、Goal、Reminder、Schedule 4 个模块的统计数据，
 * 提供统一的 Dashboard 数据视图。
 *
 * @author Bmad Master Agent - Backend Dev 1
 * @date 2025-11-12
 * @sprint Sprint 1
 * @task TASK-1.1.1
 */

import type { TaskStatisticsClientDTO } from '../task/aggregates/task-statistics-client';
import type { GoalStatisticsClientDTO } from '../goal/aggregates/goal-statistics-client';
import type { ReminderStatisticsClientDTO } from '../reminder/aggregates/reminder-statistics-client';
import type { ScheduleStatisticsClientDTO } from '../schedule/aggregates/schedule-statistics-client';

// ============ DTO 定义 ============

/**
 * Dashboard 汇总统计数据
 */
export interface DashboardSummary {
  /** 任务总数（模板数） */
  totalTasks: number;

  /** 目标总数 */
  totalGoals: number;

  /** 提醒总数 */
  totalReminders: number;

  /** 日程任务总数 */
  totalScheduleTasks: number;

  /**
   * 总体完成率（加权平均）
   *
   * 计算公式：Task 60% + Goal 40%
   * 范围：0-100
   */
  overallCompletionRate: number;
}

/**
 * Dashboard 统计数据 Client DTO
 *
 * @example
 * ```typescript
 * const dashboardStats: DashboardStatisticsClientDTO = {
 *   identityId: 'user-123',
 *   summary: {
 *     totalTasks: 45,
 *     totalGoals: 12,
 *     totalReminders: 8,
 *     totalScheduleTasks: 23,
 *     overallCompletionRate: 67.5
 *   },
 *   taskStats: { ... },
 *   goalStats: { ... },
 *   reminderStats: { ... },
 *   scheduleStats: { ... },
 *   calculatedAt: 1731398400000,
 *   cacheHit: true
 * };
 * ```
 */
export interface DashboardStatisticsClientDTO {
  /** 账户 ID */
  identityId: string;

  /** 汇总数据 */
  summary: DashboardSummary;

  /** 任务模块统计数据 */
  taskStats: TaskStatisticsClientDTO;

  /** 目标模块统计数据 */
  goalStats: GoalStatisticsClientDTO;

  /** 提醒模块统计数据 */
  reminderStats: ReminderStatisticsClientDTO;

  /** 日程模块统计数据 */
  scheduleStats: ScheduleStatisticsClientDTO;

  /**
   * 统计数据计算时间（Unix 时间戳，毫秒）
   *
   * @example 1731398400000
   */
  calculatedAt: number;

  /**
   * 是否命中缓存
   *
   * - `true`: 从 Redis 缓存读取
   * - `false`: 实时计算
   */
  cacheHit: boolean;
}

// ============ 类型守卫 ============

/**
 * 类型守卫：检查是否为有效的 DashboardStatisticsClientDTO
 */
export function isDashboardStatisticsClientDTO(
  value: unknown,
): value is DashboardStatisticsClientDTO {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const dto = value as DashboardStatisticsClientDTO;

  return (
    typeof dto.identityId === 'string' &&
    typeof dto.summary === 'object' &&
    typeof dto.summary.totalTasks === 'number' &&
    typeof dto.summary.totalGoals === 'number' &&
    typeof dto.summary.totalReminders === 'number' &&
    typeof dto.summary.totalScheduleTasks === 'number' &&
    typeof dto.summary.overallCompletionRate === 'number' &&
    typeof dto.taskStats === 'object' &&
    typeof dto.goalStats === 'object' &&
    typeof dto.reminderStats === 'object' &&
    typeof dto.scheduleStats === 'object' &&
    typeof dto.calculatedAt === 'number' &&
    typeof dto.cacheHit === 'boolean'
  );
}

// ============ 工具函数 ============

/**
 * 创建空的 Dashboard 统计数据（兜底数据）
 *
 * @param identityId - 身份 ID
 * @returns 空的 Dashboard 统计数据
 */
export function createEmptyDashboardStatistics(identityId: string): DashboardStatisticsClientDTO {
  return {
    identityId,
    summary: {
      totalTasks: 0,
      totalGoals: 0,
      totalReminders: 0,
      totalScheduleTasks: 0,
      overallCompletionRate: 0,
    },
    // TODO: 使用各模块的空数据创建函数
    taskStats: {} as TaskStatisticsClientDTO,
    goalStats: {} as GoalStatisticsClientDTO,
    reminderStats: {} as ReminderStatisticsClientDTO,
    scheduleStats: {} as ScheduleStatisticsClientDTO,
    calculatedAt: Date.now(),
    cacheHit: false,
  };
}
