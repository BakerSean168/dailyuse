/**
 * AI Module - Infrastructure Client
 *
 * Exports:
 * - Types: IAIConversationApiClient, IAIMessageApiClient, IAIGenerationTaskApiClient, etc.
 * - Adapters: HTTP and IPC implementations
 * - Providers: OpenAI and other LLM providers
 * - Prompts: AI prompt templates
 */

// Types (port interfaces + transport interfaces)
export type {
  IHttpClient,
  IIpcClient,
  IAICapabilitiesApiClient,
  AIEvaluationReportApiClient,
  AIAgentRuntimeApiClient,
  AIAnalyticsQueryApiClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGoalApiClient,
  AIKnowledgeQueryApiClient,
  AIKnowledgeNoteApiClient,
  IAIProviderConfigApiClient,
} from './adapters/types';

// Adapters
export {
  // HTTP
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIProviderConfigHttpAdapter,
  AIEvaluationReportHttpAdapter,
  AIAgentRuntimeHttpAdapter,
  createAIHttpAdapters,
  // IPC
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigIpcAdapter,
  AIEvaluationReportIpcAdapter,
  AIAgentRuntimeIpcAdapter,
  AIGoalIpcAdapter,
  AIKnowledgeNoteIpcAdapter,
  createAIIpcAdapters,
} from './adapters';

// Prompts
export * from './prompts';
