/**
 * TaskStatistics Aggregate Root - Server Interface
 * 任务统计聚合根 - 服务端接口
 */

import type { TemplateStatsInfoDTO } from '../../../shared/dtos';
import type { TaskStatisticsClientDTO } from './TaskStatisticsClient';

// ============ 子统计信息接口 ============

/**
 * 模板统计信息
 */
export type TemplateStatsInfo = TemplateStatsInfoDTO;

/**
 * 实例统计信息
 */
export interface InstanceStatsInfo {
  totalInstances: number;
  todayInstances: number;
  weekInstances: number;
  monthInstances: number;
  pendingInstances: number;
  inProgressInstances: number;
  completedInstances: number;
  skippedInstances: number;
  expiredInstances: number;
}

/**
 * 完成统计信息
 */
export interface CompletionStatsInfo {
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  totalCompleted: number;
  averageCompletionTime?: number | null; // 平均完成时间（毫秒）
  completionRate: number; // 完成率 0-100
}

/**
 * 时间统计信息
 */
export interface TimeStatsInfo {
  allDayTasks: number;
  timePointTasks: number;
  timeRangeTasks: number;
  overdueInstances: number;
  upcomingInstances: number; // 即将到期的实例
}

/**
 * 分布统计信息
 */
export interface DistributionStatsInfo {
  tasksByImportance: Record<string, number>; // 按重要性分布
  tasksByUrgency: Record<string, number>; // 按紧急度分布
  tasksByFolder: Record<string, number>; // 按文件夹分布
  tasksByTag: Record<string, number>; // 按标签分布
}

// ============ DTO 定义 ============

/**
 * TaskStatistics Server DTO
 */
export interface TaskStatisticsServerDTO {
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: number; // epoch ms
}

/**
 * TaskStatistics Persistence DTO (数据库映射)
 */
export interface TaskStatisticsPersistenceDTO {
  uuid: string;
  accountUuid: string;

  // Flattened template_stats
  templateTotal: number;
  templateActive: number;
  templatePaused: number;
  templateArchived: number;
  templateOneTime: number;
  templateRecurring: number;

  // Flattened instance_stats
  instanceTotal: number;
  instanceToday: number;
  instanceWeek: number;
  instanceMonth: number;
  instancePending: number;
  instanceInProgress: number;
  instanceCompleted: number;
  instanceSkipped: number;
  instanceExpired: number;

  // Flattened completion_stats
  completionToday: number;
  completionWeek: number;
  completionMonth: number;
  completionTotal: number;
  completionAvgTime?: number | null;
  completionRate: number;

  // Flattened time_stats
  timeAllDay: number;
  timePoint: number;
  timeRange: number;
  timeOverdue: number;
  timeUpcoming: number;

  // Distribution stats can remain as JSON
  distributionByImportance: string; // JSON
  distributionByUrgency: string; // JSON
  distributionByFolder: string; // JSON
  distributionByTag: string; // JSON

  calculatedAt: number;
}

// ============ 领域事件 ============

/**
 * 任务统计更新事件
 */
export interface TaskStatisticsUpdatedEvent {
  type: 'task.statistics.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    statistics: TaskStatisticsServerDTO;
    previousStatistics?: TaskStatisticsServerDTO;
  };
}

/**
 * 任务统计重新计算事件
 */
export interface TaskStatisticsRecalculatedEvent {
  type: 'task.statistics.recalculated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    statistics: TaskStatisticsServerDTO;
    reason: string; // 重新计算的原因
  };
}

/**
 * TaskStatistics 领域事件联合类型
 */
export type TaskStatisticsDomainEvent =
  | TaskStatisticsUpdatedEvent
  | TaskStatisticsRecalculatedEvent;

// ============ 实体接口 ============

/**
 * TaskStatistics 聚合根 - Server 接口（实例方法）
 */
export interface TaskStatisticsServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: number;

  // ===== 业务方法 =====

  /**
   * 重新计算统计信息
   */
  recalculate(templates: any[], instances: any[]): void;

  /**
   * 更新模板统计
   */
  updateTemplateStats(templateStats: Partial<TemplateStatsInfo>): void;

  /**
   * 更新实例统计
   */
  updateInstanceStats(instanceStats: Partial<InstanceStatsInfo>): void;

  /**
   * 更新完成统计
   */
  updateCompletionStats(completionStats: Partial<CompletionStatsInfo>): void;

  /**
   * 获取今日完成率
   */
  getTodayCompletionRate(): number;

  /**
   * 获取本周完成率
   */
  getWeekCompletionRate(): number;

  /**
   * 获取效率趋势
   */
  getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE';

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Client DTO
   */
  /**
   * 转换为 Persistence DTO (数据库)
   */}
