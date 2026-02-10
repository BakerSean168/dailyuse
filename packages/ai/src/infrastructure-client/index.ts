/**
 * AI Module - Infrastructure Client
 *
 * Exports:
 * - Container: AIContainer
 * - Ports: IAIConversationApiClient, IAIMessageApiClient, IAIGenerationTaskApiClient, etc.
 * - Adapters: HTTP and IPC implementations
 * - Providers: OpenAI and other LLM providers
 * - Prompts: AI prompt templates
 */

// Container
export { AIContainer, AIDependencyKeys } from './ai.container';

// Ports
export type {
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGenerationTaskApiClient,
  IAIUsageQuotaApiClient,
  IAIProviderConfigApiClient,
} from './ports';

// Adapters
export {
  // HTTP
  AIConversationHttpAdapter,
  AIMessageHttpAdapter,
  AIGenerationTaskHttpAdapter,
  AIUsageQuotaHttpAdapter,
  AIProviderConfigHttpAdapter,
  // IPC
  AIConversationIpcAdapter,
  AIMessageIpcAdapter,
  AIGenerationTaskIpcAdapter,
  AIUsageQuotaIpcAdapter,
  AIProviderConfigIpcAdapter,
} from './adapters';

// Providers
export * from './providers';

// Prompts
export * from './prompts';
