/**
 * AI Module Exports
 * AI模块 - 显式导出
 */

// ============ Service Interfaces ============
export type { IAIService, AIServiceConfig } from './services';

// ============ Enums ============
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
} from './enums';

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
export type {
  CreateConversationRequest,
  UpdateConversationRequest,
  ConversationResponse,
  ConversationListResponse,
  SendMessageRequest,
  MessageResponse,
  MessageListResponse,
  CreateGenerationTaskRequest,
  GenerationTaskResponse,
  GenerationTaskListResponse,
  ChatStreamRequest,
  ChatStreamChunk,
  QuotaResponse,
  UpdateQuotaLimitRequest,
  ListRequest,
} from './api-requests';

export type {
  GeneratedGoalDraft,
  GenerateGoalResponse,
  GenerateGoalWithKRsResponse,
} from './api-responses/generate-goal-response';

export type {
  KeyResultPreview,
  GenerateKeyResultsResponse,
} from './api-responses/generate-key-results-response';

export type { SummarizationResultDTO } from './api-responses/summarization-result-dto';

export type {
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  SetDefaultProviderRequest,
  RefreshProviderModelsRequest,
  RefreshProviderModelsResponse,
} from './api-requests/ai-provider-config-request';

export type {
  GenerateGoalRequest,
  GenerateGoalWithKRsRequest,
} from './api-requests/generate-goal-request';

export { GoalCategory } from './api-requests/generate-goal-request';

// ============ Templates ============
export type { AIProviderTemplate } from './templates/ai-provider-template';
export {
  AI_PROVIDER_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
  getFreeTemplates,
} from './templates/ai-provider-template';
