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
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGoalApiClient,
  AIKnowledgeNoteApiClient,
  IAIProviderConfigApiClient,
} from './adapters/types';

// Adapters
export {
  // HTTP
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIProviderConfigHttpAdapter,
  createAIHttpAdapters,
  // IPC
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigIpcAdapter,
  createAIIpcAdapters,
} from './adapters';

// Prompts
export * from './prompts';
