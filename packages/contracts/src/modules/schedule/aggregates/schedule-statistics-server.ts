/**
 * ScheduleStatistics Aggregate Root - Server Interface
 * 调度统计聚合根 - 服务端接口
 */

import type { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '../enums';
import type { ModuleStatisticsServerDTO } from '../value-objects';
import type { ScheduleStatisticsClientDTO } from './schedule-statistics-client';

// ============ DTO 定义 ============

/**
 * ScheduleStatistics Server DTO
 */
export interface ScheduleStatisticsServerDTO {
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number; // 毫秒
  minExecutionDuration: number; // 毫秒
  maxExecutionDuration: number; // 毫秒

  // 模块统计（按来源模块分组）
  moduleStatistics: Record<string, ModuleStatisticsServerDTO>;

  // 时间戳
  lastUpdatedAt: number; // epoch ms
  createdAt: number; // epoch ms
}

/**
 * ScheduleStatistics Persistence DTO (数据库映射)
 */
export interface ScheduleStatisticsPersistenceDTO {
  id?: number; // 自增主键（可选）
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number;
  minExecutionDuration: number;
  maxExecutionDuration: number;

  // 模块统计（JSON string）
  moduleStatistics: string;

  // 时间戳
  lastUpdatedAt: Date;
  createdAt: Date;
}

// ============ 领域事件 ============

/**
 * 统计数据创建事件
 */
export interface ScheduleStatisticsCreatedEvent {
  type: 'schedule.statistics.created';
  aggregateId: string; // accountUuid
  timestamp: Date; // epoch ms
  payload: {
    accountUuid: string;
  };
}

/**
 * 统计数据更新事件
 */
export interface ScheduleStatisticsUpdatedEvent {
  type: 'schedule.statistics.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    accountUuid: string;
    changes: string[];
    previousData: Partial<ScheduleStatisticsServerDTO>;
    newData: Partial<ScheduleStatisticsServerDTO>;
  };
}

/**
 * 任务计数变更事件
 */
export interface ScheduleStatisticsTaskCountChangedEvent {
  type: 'schedule.statistics.task.count.changed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    status: ScheduleTaskStatus;
    delta: number; // +1 or -1
    totalTasks: number;
  };
}

/**
 * 执行统计更新事件
 */
export interface ScheduleStatisticsExecutionRecordedEvent {
  type: 'schedule.statistics.execution.recorded';
  aggregateId: string;
  timestamp: Date;
  payload: {
    status: ExecutionStatus;
    duration: number;
    sourceModule: SourceModule;
    totalExecutions: number;
  };
}

/**
 * 模块统计更新事件
 */
export interface ScheduleStatisticsModuleUpdatedEvent {
  type: 'schedule.statistics.module.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    moduleName: string;
    moduleStats: ModuleStatisticsServerDTO;
  };
}

/**
 * ScheduleStatistics 领域事件联合类型
 */
export type ScheduleStatisticsDomainEvent =
  | ScheduleStatisticsCreatedEvent
  | ScheduleStatisticsUpdatedEvent
  | ScheduleStatisticsTaskCountChangedEvent
  | ScheduleStatisticsExecutionRecordedEvent
  | ScheduleStatisticsModuleUpdatedEvent;

// ============ 实体接口 ============

/**
 * ScheduleStatistics 聚合根 - Server 接口
 */
export interface ScheduleStatisticsServer {
  // 基础属性
  id: number;
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number;
  minExecutionDuration: number;
  maxExecutionDuration: number;

  // 模块统计
  moduleStatistics: Record<string, ModuleStatisticsServerDTO>;

  // 时间戳
  lastUpdatedAt: Date;
  createdAt: Date;

  // ===== 业务方法 =====

  // 任务计数管理

  // 执行统计管理

  // 模块统计管理
  updateModuleStats(
    moduleName: SourceModule,
    tasksDelta: number,
    activeTasksDelta: number,
    executionsDelta: number,
    successDelta: number,
    failureDelta: number,
    durationMs: number,
  ): void;

  // 计算方法

  // 重置方法

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */

  /**
   * 转换为 Persistence DTO (数据库)
   */
}

/**
 * ScheduleStatistics 静态工厂方法接口
 */
export interface ScheduleStatisticsServerStatic {
  /**
   * 创建新的 ScheduleStatistics 聚合根（静态工厂方法）
   */

  /**
   * 从 Server DTO 创建实体
   */

  /**
   * 从 Persistence DTO 创建实体
   */
}
