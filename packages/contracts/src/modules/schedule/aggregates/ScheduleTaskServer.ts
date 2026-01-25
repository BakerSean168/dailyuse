/**
 * ScheduleTask Aggregate Root - Server Interface
 * 调度任务聚合根 - 服务端接口
 */

import type { ScheduleTaskClientDTO } from './ScheduleTaskClient';
import type { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '../enums';
import type {
  ScheduleExecutionServer,
  ScheduleExecutionServerDTO,
} from '../entities/ScheduleExecutionServer';

// 从值对象导入类型
import type {
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
  uuid: string;
  accountUuid: string;
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
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // ===== 子实体 DTO (聚合根包含子实体) =====
  executions?: ScheduleExecutionServerDTO[] | null; // 执行记录列表（可选加载）
}

/**
 * ScheduleTask Persistence DTO (数据库映射)
 */
export interface ScheduleTaskPersistenceDTO {
  uuid: string;
  accountUuid: string;
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
  createdAt: Date;
  updatedAt: Date;

  // 注意：子实体在数据库中是独立表，通过外键关联
}

// ============ 领域事件 ============

/**
 * 任务创建事件
 */
export interface ScheduleTaskCreatedEvent {
  type: 'schedule.task.created';
  aggregateId: string; // taskUuid
  timestamp: Date; // epoch ms
  payload: {
    taskUuid: string;
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
    taskUuid: string;
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
    taskUuid: string;
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
    taskUuid: string;
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
    taskUuid: string;
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
    taskUuid: string;
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
    taskUuid: string;
    executionUuid: string;
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
    taskUuid: string;
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
  uuid: string;
  accountUuid: string;
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

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  updatedAt: Date;

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
  addExecution(execution: ScheduleExecutionServer): void;

  /**
   * 通过 UUID 获取执行记录
   */
  getExecution(uuid: string): ScheduleExecutionServer | null;

  /**
   * 获取所有执行记录
   */
  getAllExecutions(): ScheduleExecutionServer[];

  /**
   * 获取最近的执行记录
   */
  getRecentExecutions(limit: number): ScheduleExecutionServer[];

  /**
   * 获取失败的执行记录
   */
  getFailedExecutions(): ScheduleExecutionServer[];

  // ===== 业务方法 =====

  // 生命周期管理
  pause(reason?: string): void;
  resume(): void;
  complete(): void;
  cancel(reason: string): void;
  fail(error: string): void;

  // 调度配置管理
  updateSchedule(schedule: Partial<ScheduleConfigServerDTO>): void;
  updateCronExpression(cronExpression: string): void;
  calculateNextRun(): number;

  // 执行信息管理
  recordExecution(
    status: ExecutionStatus,
    duration: number,
    result?: Record<string, any>,
    error?: string,
  ): ScheduleExecutionServer;
  updateExecutionInfo(updates: Partial<ExecutionInfoServerDTO>): void;
  resetFailures(): void;

  // 重试策略管理
  updateRetryPolicy(policy: Partial<RetryPolicyServerDTO>): void;
  shouldRetry(): boolean;
  calculateNextRetryDelay(): number;

  // 元数据管理
  updateMetadata(metadata: Partial<TaskMetadataServerDTO>): void;
  updatePayload(payload: Record<string, any>): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;

  // 启用/禁用
  enable(): void;
  disable(): void;

  // 状态检查
  isActive(): boolean;
  isPaused(): boolean;
  isCompleted(): boolean;
  isCancelled(): boolean;
  isFailed(): boolean;
  isExpired(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): ScheduleTaskServerDTO;

  /**
   * 转换为 Client DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): ScheduleTaskClientDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   * 注意：子实体在数据库中是独立表，不包含在 Persistence DTO 中
   */
  toPersistenceDTO(): ScheduleTaskPersistenceDTO;
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
    accountUuid: string;
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
  fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTaskServer;

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
  fromPersistenceDTO(dto: ScheduleTaskPersistenceDTO): ScheduleTaskServer;
}
