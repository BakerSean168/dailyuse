/**
 * AI Module - Infrastructure Client
 *
 * Exports:
 * - Container: AIContainer
 * - Types: IAIConversationApiClient, IAIMessageApiClient, IAIGenerationTaskApiClient, etc.
 * - Adapters: HTTP and IPC implementations
 * - Providers: OpenAI and other LLM providers
 * - Prompts: AI prompt templates
 */

// Container
export { AIContainer, AIDependencyKeys } from './ai.container';

// Types (port interfaces + transport interfaces)
export type {
  IHttpClient,
  IIpcClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGenerationTaskApiClient,
  IAIUsageQuotaApiClient,
  IAIProviderConfigApiClient,
} from './adapters/types';

// Adapters
export {
  // HTTP
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIGenerationTaskHttpAdapter,
  AIUsageQuotaHttpAdapter,
  AIProviderConfigHttpAdapter,
  createAIHttpAdapters,
  // IPC
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIGenerationTaskIpcAdapter,
  AIUsageQuotaIpcAdapter,
  AIProviderConfigIpcAdapter,
  createAIIpcAdapters,
} from './adapters';

// Providers
export * from './providers';

// Prompts
export * from './prompts';
