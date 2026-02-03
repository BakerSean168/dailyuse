/**
 * AI Module Exports
 * AI模块 - 统一导出 subfolders 下的所有内容 直接 export * from './folder-name'
 */

// ============ Protocol ============
export * from './protocol';

// ============ API ============
export * from './api';

// ============ Value Objects (Enum-like) ============
export {
  ConversationStatus,
  MessageRole,
  GenerationTaskType,
  TaskStatus,
  AIProvider,
  AIProviderType,
  AIModel,
  KnowledgeDocumentTemplateType,
  MetricType,
  QuotaResetPeriod,
  AITaskPriority,
} from './value-objects';

// ============ Aggregates ============
export type {
  AIConversationClientDTO,
  AIConversationClient,
  AIConversationClientInstance,
} from './aggregates/ai-conversation-client';

export type {
  AIConversationServerDTO,
  AIConversationPersistenceDTO,
  AIConversationCreatedEvent,
  AIConversationUpdatedEvent,
  AIMessageAddedEvent,
  AIConversationDeletedEvent,
  AIConversationServer,
} from './aggregates/ai-conversation-server';

export type {
  AIGenerationTaskClientDTO,
  AIGenerationTaskClient,
} from './aggregates/ai-generation-task-client';

export type {
  AIGenerationTaskServerDTO,
  AIGenerationTaskPersistenceDTO,
  AIGenerationTaskCreatedEvent,
  AIGenerationTaskStatusChangedEvent,
  AIGenerationTaskCompletedEvent,
  AIGenerationTaskFailedEvent,
  AIGenerationTaskRetriedEvent,
  AIGenerationTaskServer,
} from './aggregates/ai-generation-task-server';

export type {
  AIUsageQuotaClientDTO,
  AIUsageQuotaClient,
} from './aggregates/ai-usage-quota-client';

export type {
  AIUsageQuotaServerDTO,
  AIUsageQuotaPersistenceDTO,
  AIUsageQuotaCreatedEvent,
  AIUsageQuotaConsumedEvent,
  AIUsageQuotaResetEvent,
  AIUsageQuotaExceededEvent,
  AIUsageQuotaLimitUpdatedEvent,
  AIUsageQuotaServer,
} from './aggregates/ai-usage-quota-server';

export type {
  AIProviderConfigClientDTO,
  AIModelInfo,
  AIProviderConfigSummary,
} from './aggregates/ai-provider-config-client';

export type { AIProviderConfigServerDTO } from './aggregates/ai-provider-config-server';

// ============ Entities ============
export type {
  MessageClientDTO,
  MessageClient,
} from './entities/message-client';

export type {
  MessageServerDTO,
  MessagePersistenceDTO,
  MessageServer,
} from './entities/message-server';

// ============ Value Objects ============
export type {
  GenerationInputClientDTO,
  GenerationInputServerDTO,
  GenerationInputPersistenceDTO,
} from './value-objects/generation-input';

export type {
  GenerationResultClientDTO,
  GenerationResultServerDTO,
  GenerationResultPersistenceDTO,
} from './value-objects/generation-result';

export type {
  TokenUsageClientDTO,
  TokenUsageServerDTO,
  TokenUsagePersistenceDTO,
} from './value-objects/token-usage';

// ============ API Requests & Responses ============

