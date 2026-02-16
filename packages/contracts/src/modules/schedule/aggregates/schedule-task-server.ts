/**
 * ScheduleTask Aggregate Root - Server Interface
 * 调度任务聚合根 - 服务端接口
 */

import type { ScheduleTaskClientDTO } from './schedule-task-client';
import type {
  ScheduleExecutionServer,
  ScheduleExecutionServerDTO,
} from '../entities/schedule-execution-server';
import type {
  ScheduleTaskStatus,
  SourceModule,
  ExecutionStatus,
  ScheduleConfigServer,
  ScheduleConfigServerDTO,
  ExecutionInfoServer,
  ExecutionInfoServerDTO,
  RetryPolicyServer,
  RetryPolicyServerDTO,
  TaskMetadataServer,
  TaskMetadataServerDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleTask Server DTO
 */
export interface ScheduleTaskServerDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象
  schedule: ScheduleConfigServerDTO;
  execution: ExecutionInfoServerDTO;
  retryPolicy: RetryPolicyServerDTO;
  metadata: TaskMetadataServerDTO;

  // 时间戳
  version: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt: number | null; // epoch ms

  // ===== 子实体 DTO (聚合根包含子实体) =====
  executions?: ScheduleExecutionServerDTO[] | null; // 执行记录列表（可选加载）
}

/**
 * ScheduleTask Persistence DTO (数据库映射)
 */
export interface ScheduleTaskPersistenceDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // ========== ScheduleConfig 值对象（展开字段）==========
  cronExpression: string | null;
  timezone: string;
  startDate: Date | null;
  endDate: Date | null;
  maxExecutions: number | null;

  // ========== ExecutionInfo 值对象（展开字段）==========
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  executionCount: number;
  lastExecutionStatus: string | null;
  lastExecutionDuration: number | null; // ms
  consecutiveFailures: number;

  // ========== RetryPolicy 值对象（展开字段）==========
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses: string; // JSON array string

  // ========== TaskMetadata 值对象（展开字段）==========
  payload: any | null; // JSON (复杂数据保留)
  tags: string; // JSON array string
  priority: string;
  timeout: number | null;

  // 时间戳
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // 注意：子实体在数据库中是独立表，通过外键关联
}

// ============ 领域事件 ============

/**
 * 任务创建事件
 */
export interface ScheduleTaskCreatedEvent {
  type: 'schedule.task.created';
  aggregateId: string; // taskId
  timestamp: Date; // epoch ms
  payload: {
    taskId: string;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    cronExpression: string;
    nextRunAt: number;
  };
}

/**
 * 任务暂停事件
 */
export interface ScheduleTaskPausedEvent {
  type: 'schedule.task.paused';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    reason?: string;
  };
}

/**
 * 任务恢复事件
 */
export interface ScheduleTaskResumedEvent {
  type: 'schedule.task.resumed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    nextRunAt: number;
  };
}

/**
 * 任务完成事件
 */
export interface ScheduleTaskCompletedEvent {
  type: 'schedule.task.completed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    totalExecutions: number;
  };
}

/**
 * 任务取消事件
 */
export interface ScheduleTaskCancelledEvent {
  type: 'schedule.task.cancelled';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    reason: string;
  };
}

/**
 * 任务失败事件
 */
export interface ScheduleTaskFailedEvent {
  type: 'schedule.task.failed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    error: string;
    consecutiveFailures: number;
  };
}

/**
 * 任务执行事件（核心集成事件）
 */
export interface ScheduleTaskExecutedEvent {
  type: 'schedule.task.executed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    executionId: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ExecutionStatus;
    duration: number;
    payload: Record<string, any>; // 传递给业务模块的数据
  };
}

/**
 * 任务调度配置更新事件
 */
export interface ScheduleTaskScheduleUpdatedEvent {
  type: 'schedule.task.schedule.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskId: string;
    previousCronExpression: string;
    newCronExpression: string;
    nextRunAt: number;
  };
}

/**
 * ScheduleTask 领域事件联合类型
 */
export type ScheduleTaskDomainEvent =
  | ScheduleTaskCreatedEvent
  | ScheduleTaskPausedEvent
  | ScheduleTaskResumedEvent
  | ScheduleTaskCompletedEvent
  | ScheduleTaskCancelledEvent
  | ScheduleTaskFailedEvent
  | ScheduleTaskExecutedEvent
  | ScheduleTaskScheduleUpdatedEvent;

// ============ 实体接口 ============

/**
 * ScheduleTask 聚合根 - Server 接口（实例方法）
 */
export interface ScheduleTaskServer {
  // 基础属性
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象
  schedule: ScheduleConfigServer;
  execution: ExecutionInfoServer;
  retryPolicy: RetryPolicyServer;
  metadata: TaskMetadataServer;

  // 同步字段
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 执行记录列表（懒加载，可选）
   * 通过聚合根统一访问和管理子实体
   */
  executions?: ScheduleExecutionServer[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：ScheduleExecution（通过聚合根创建）
   * @param params 执行记录创建参数
   * @returns 新的 ScheduleExecution 实例
   */
  createExecution(params: {
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecutionServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加执行记录到聚合根
   */

  /**
   * 通过 UUID 获取执行记录
   */

  /**
   * 获取所有执行记录
   */

  /**
   * 获取最近的执行记录
   */

  /**
   * 获取失败的执行记录
   */

  // ===== 业务方法 =====

  // 生命周期管理

  // 调度配置管理

  // 执行信息管理
  recordExecution(
    status: ExecutionStatus,
    duration: number,
    result?: Record<string, any>,
    error?: string,
  ): ScheduleExecutionServer;

  // 重试策略管理

  // 元数据管理

  // 启用/禁用

  // 状态检查

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */

  /**
   * 转换为 Client DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */

  /**
   * 转换为 Persistence DTO (数据库)
   * 注意：子实体在数据库中是独立表，不包含在 Persistence DTO 中
   */
}

/**
 * ScheduleTask 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface ScheduleTaskServerStatic {
  /**
   * 创建新的 ScheduleTask 聚合根（静态工厂方法）
   * @param params 创建参数
   * @returns 新的 ScheduleTask 实例
   */
  create(params: {
    identityId: string;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    schedule: ScheduleConfigServerDTO;
    description?: string;
    metadata?: Partial<TaskMetadataServerDTO>;
    retryPolicy?: Partial<RetryPolicyServerDTO>;
  }): ScheduleTaskServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
}
