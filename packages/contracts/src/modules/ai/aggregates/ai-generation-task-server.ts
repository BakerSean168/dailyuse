/**
 * AIGenerationTask Aggregate Root - Server Interface
 * AI生成任务聚合根 - 服务端接口
 */

import type { AiGenerationTaskId, AiConversationId, IdentityId, TransferDate, DomainDate, PersistenceDate } from '../../../primitives';
import type { GenerationTaskType } from '../value-objects/generation-task-type';
import type { TaskStatus } from '../value-objects/task-status';
import type { AIProvider } from '../value-objects/ai-provider';
import type { AIModel } from '../value-objects/ai-model';
import type { GenerationInputServerDTO } from '../value-objects/generation-input';
import type { GenerationResultServerDTO } from '../value-objects/generation-result';
import type { TokenUsageServerDTO } from '../value-objects/token-usage';

// ============ DTO 定义 ============

/**
 * AIGenerationTask Server DTO（应用层）
 * 使用 TransferDate (number) 时间戳
 */
export interface AIGenerationTaskServerDTO {
  id: AiGenerationTaskId;
  identityId: IdentityId;
  conversationId: AiConversationId | null;
  type: GenerationTaskType;
  status: TaskStatus;
  provider: AIProvider;
  model: AIModel;
  input: GenerationInputServerDTO;
  result: GenerationResultServerDTO | null;
  tokenUsage: TokenUsageServerDTO | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  processingStartedAt: TransferDate | null;
  processingCompletedAt: TransferDate | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * AIGenerationTask Persistence DTO（数据库层）
 * 使用 PersistenceDate (Date 对象)
 */
export interface AIGenerationTaskPersistenceDTO {
  id: AiGenerationTaskId;
  identityId: IdentityId;
  conversationId: AiConversationId | null;
  type: GenerationTaskType;
  status: TaskStatus;
  provider: AIProvider;
  model: AIModel;
  input: string; // JSON string
  result: string | null; // JSON string
  tokenUsage: string | null; // JSON string
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  processingStartedAt: PersistenceDate | null;
  processingCompletedAt: PersistenceDate | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 领域事件 ============

/**
 * 生成任务创建事件
 */
export interface AIGenerationTaskCreatedEvent {
  type: 'ai_generation_task.created';
  aggregateId: AiGenerationTaskId;
  timestamp: DomainDate;
  payload: {
    task: AIGenerationTaskServerDTO;
    identityId: IdentityId;
  };
}

/**
 * 生成任务状态变更事件
 */
export interface AIGenerationTaskStatusChangedEvent {
  type: 'ai_generation_task.status_changed';
  aggregateId: AiGenerationTaskId;
  timestamp: DomainDate;
  payload: {
    taskId: AiGenerationTaskId;
    previousStatus: TaskStatus;
    newStatus: TaskStatus;
    changedAt: DomainDate;
  };
}

/**
 * 生成任务完成事件
 */
export interface AIGenerationTaskCompletedEvent {
  type: 'ai_generation_task.completed';
  aggregateId: AiGenerationTaskId;
  timestamp: DomainDate;
  payload: {
    taskId: AiGenerationTaskId;
    result: GenerationResultServerDTO;
    tokenUsage: TokenUsageServerDTO | null;
    completedAt: DomainDate;
  };
}

/**
 * 生成任务失败事件
 */
export interface AIGenerationTaskFailedEvent {
  type: 'ai_generation_task.failed';
  aggregateId: AiGenerationTaskId;
  timestamp: DomainDate;
  payload: {
    taskId: AiGenerationTaskId;
    errorMessage: string;
    retryCount: number;
    failedAt: DomainDate;
  };
}

/**
 * 生成任务重试事件
 */
export interface AIGenerationTaskRetriedEvent {
  type: 'ai_generation_task.retried';
  aggregateId: AiGenerationTaskId;
  timestamp: DomainDate;
  payload: {
    taskId: AiGenerationTaskId;
    retryCount: number;
    retriedAt: DomainDate;
  };
}
