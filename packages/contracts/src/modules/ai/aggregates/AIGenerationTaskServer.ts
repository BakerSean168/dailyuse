/**
 * AIGenerationTask Aggregate Root - Server Interface
 * AI生成任务聚合根 - 服务端接口
 */

import type { GenerationTaskType, TaskStatus, AIProvider, AIModel } from '../enums';
import type { AIGenerationTaskClientDTO } from './AIGenerationTaskClient';
import type { GenerationInputServerDTO } from '../value-objects/GenerationInput';
import type { GenerationResultServerDTO } from '../value-objects/GenerationResult';
import type { TokenUsageServerDTO } from '../value-objects/TokenUsage';

// ============ DTO 定义 ============

/**
 * AIGenerationTask Server DTO（应用层）
 */
export interface AIGenerationTaskServerDTO {
  uuid: string;
  accountUuid: string;
  conversationUuid?: string | null;
  type: GenerationTaskType;
  status: TaskStatus;
  provider: AIProvider;
  model: AIModel;
  input: GenerationInputServerDTO;
  result?: GenerationResultServerDTO | null;
  tokenUsage?: TokenUsageServerDTO | null;
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  processingStartedAt?: number | null;
  processingCompletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * AIGenerationTask Persistence DTO（数据库层）
 * 注意：使用 camelCase 命名，与数据库 snake_case 的映射在仓储层处理
 */
export interface AIGenerationTaskPersistenceDTO {
  uuid: string;
  accountUuid: string;
  conversationUuid?: string | null;
  type: GenerationTaskType;
  status: TaskStatus;
  provider: AIProvider;
  model: AIModel;
  input: string; // JSON string
  result?: string | null; // JSON string
  tokenUsage?: string | null; // JSON string
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  processingStartedAt?: number | null;
  processingCompletedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 领域事件 ============

/**
 * 生成任务创建事件
 */
export interface AIGenerationTaskCreatedEvent {
  type: 'ai_generation_task.created';
  aggregateId: string; // taskUuid
  timestamp: Date;
  payload: {
    task: AIGenerationTaskServerDTO;
    accountUuid: string;
  };
}

/**
 * 生成任务状态变更事件
 */
export interface AIGenerationTaskStatusChangedEvent {
  type: 'ai_generation_task.status_changed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskUuid: string;
    previousStatus: TaskStatus;
    newStatus: TaskStatus;
    changedAt: Date;
  };
}

/**
 * 生成任务完成事件
 */
export interface AIGenerationTaskCompletedEvent {
  type: 'ai_generation_task.completed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskUuid: string;
    result: GenerationResultServerDTO;
    tokenUsage?: TokenUsageServerDTO | null;
    completedAt: Date;
  };
}

/**
 * 生成任务失败事件
 */
export interface AIGenerationTaskFailedEvent {
  type: 'ai_generation_task.failed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskUuid: string;
    errorMessage: string;
    retryCount: number;
    failedAt: Date;
  };
}

/**
 * 生成任务重试事件
 */
export interface AIGenerationTaskRetriedEvent {
  type: 'ai_generation_task.retried';
  aggregateId: string;
  timestamp: Date;
  payload: {
    taskUuid: string;
    retryCount: number;
    retriedAt: Date;
  };
}

// ============ 实体接口 ============

/**
 * AIGenerationTask 聚合根 - Server 接口（实例方法）
 */
export interface AIGenerationTaskServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  conversationUuid?: string | null;
  type: GenerationTaskType;
  status: TaskStatus;
  provider: AIProvider;
  model: AIModel;
  input: GenerationInputServerDTO;
  result?: GenerationResultServerDTO | null;
  tokenUsage?: TokenUsageServerDTO | null;
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  processingStartedAt?: number | null;
  processingCompletedAt?: number | null;
  createdAt: Date;
  updatedAt: Date;

  // ===== 状态管理方法 =====

  /**
   * 开始处理任务
   */
  startProcessing(): void;

  /**
   * 标记任务完成
   */
  markCompleted(result: GenerationResultServerDTO, tokenUsage?: TokenUsageServerDTO): void;

  /**
   * 标记任务失败
   */
  markFailed(errorMessage: string): void;

  /**
   * 重试任务
   */
  retry(): void;

  /**
   * 取消任务
   */
  cancel(): void;

  /**
   * 检查是否可以重试
   */
  canRetry(): boolean;

  /**
   * 获取处理持续时间（毫秒）
   */
  getProcessingDuration(): number | null;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): AIGenerationTaskServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): AIGenerationTaskClientDTO;

  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): AIGenerationTaskPersistenceDTO;
}

/**
 * AIGenerationTask 静态工厂方法接口
 */
export interface AIGenerationTaskServerStatic {
  /**
   * 创建新的 AIGenerationTask 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    conversationUuid?: string;
    type: GenerationTaskType;
    provider: AIProvider;
    model: AIModel;
    input: GenerationInputServerDTO;
    maxRetries?: number;
  }): AIGenerationTaskServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: AIGenerationTaskServerDTO): AIGenerationTaskServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: AIGenerationTaskPersistenceDTO): AIGenerationTaskServer;
}
