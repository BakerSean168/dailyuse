/**
 * ScheduleStatistics API Requests
 * 调度统计 API 请求定义
 */

import type { ScheduleStatisticsClientDTO } from '../../aggregates/schedule-statistics-client';
import type { ScheduleExecutionClientDTO } from '../../entities/schedule-execution-client';
import type { ScheduleTaskClientDTO } from '../../aggregates/schedule-task-client';
import type { SourceModule } from '../../value-objects/source-module';

// ============ Response Types ============

/**
 * 统计数据响应
 */
export type ScheduleStatisticsDTO = ScheduleStatisticsClientDTO;

/**
 * 仪表盘统计响应
 */
export interface ScheduleDashboardStatsDTO {
  readonly overview: ScheduleStatisticsClientDTO;
  readonly recentExecutions: readonly ScheduleExecutionClientDTO[];
  readonly failedTasks: readonly ScheduleTaskClientDTO[];
  readonly upcomingTasks: readonly {
    task: ScheduleTaskClientDTO;
    nextRunAt: number;
    timeUntilRun: number;
  }[];
}

/**
 * 模块统计响应
 */
export interface ModuleStatsResponseDTO {
  readonly moduleName: SourceModule;
  readonly totalTasks: number;
  readonly activeTasks: number;
  readonly totalExecutions: number;
  readonly successRate: number;
  readonly avgDuration: number;
  readonly recentTasks: readonly ScheduleTaskClientDTO[];
}
