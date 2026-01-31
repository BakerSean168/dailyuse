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
  AIConversationClient,  AIConversationClientInstance,
} from './aggregates/AIConversationClient';

export type {
  AIConversationServerDTO,
  AIConversationPersistenceDTO,
  AIConversationCreatedEvent,
  AIConversationUpdatedEvent,
  AIMessageAddedEvent,
  AIConversationDeletedEvent,
  AIConversationServer,} from './aggregates/AIConversationServer';

export type {
  AIGenerationTaskClientDTO,
  AIGenerationTaskClient,  AIGenerationTaskClientInstance,
} from './aggregates/AIGenerationTaskClient';

export type {
  AIGenerationTaskServerDTO,
  AIGenerationTaskPersistenceDTO,
  AIGenerationTaskCreatedEvent,
  AIGenerationTaskStatusChangedEvent,
  AIGenerationTaskCompletedEvent,
  AIGenerationTaskFailedEvent,
  AIGenerationTaskRetriedEvent,
  AIGenerationTaskServer,} from './aggregates/AIGenerationTaskServer';

export type {
  AIUsageQuotaClientDTO,
  AIUsageQuotaClient,} from './aggregates/AIUsageQuotaClient';

export type {
  AIUsageQuotaServerDTO,
  AIUsageQuotaPersistenceDTO,
  AIUsageQuotaCreatedEvent,
  AIUsageQuotaConsumedEvent,
  AIUsageQuotaResetEvent,
  AIUsageQuotaExceededEvent,
  AIUsageQuotaLimitUpdatedEvent,
  AIUsageQuotaServer,} from './aggregates/AIUsageQuotaServer';

export type {
  AIProviderConfigClientDTO,
  AIModelInfo,
  AIProviderConfigSummary,
} from './aggregates/AIProviderConfigClient';

export type { AIProviderConfigServerDTO } from './aggregates/AIProviderConfigServer';

// ============ Entities ============
export type {
  MessageClientDTO,
  MessageClient,} from './entities/MessageClient';

export type {
  MessageServerDTO,
  MessagePersistenceDTO,
  MessageServer,} from './entities/MessageServer';

// ============ Value Objects ============
export type {
  GenerationInputClientDTO,
  GenerationInputServerDTO,
  GenerationInputPersistenceDTO,
} from './value-objects/GenerationInput';

export type {
  GenerationResultClientDTO,
  GenerationResultServerDTO,
  GenerationResultPersistenceDTO,
} from './value-objects/GenerationResult';

export type {
  TokenUsageClientDTO,
  TokenUsageServerDTO,
  TokenUsagePersistenceDTO,
} from './value-objects/TokenUsage';

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
} from './api-responses/GenerateGoalResponse';

export type {
  KeyResultPreview,
  GenerateKeyResultsResponse,
} from './api-responses/GenerateKeyResultsResponse';

export type { SummarizationResultDTO } from './api-responses/SummarizationResultDTO';

export type {
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  SetDefaultProviderRequest,
  RefreshProviderModelsRequest,
  RefreshProviderModelsResponse,
} from './api-requests/AIProviderConfigRequest';

export type {
  GenerateGoalRequest,
  GenerateGoalWithKRsRequest,
} from './api-requests/GenerateGoalRequest';

export { GoalCategory } from './api-requests/GenerateGoalRequest';

// ============ Templates ============
export type { AIProviderTemplate } from './templates/AIProviderTemplate';
export {
  AI_PROVIDER_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
  getFreeTemplates,
} from './templates/AIProviderTemplate';
