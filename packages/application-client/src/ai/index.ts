/**
 * AI Module - Application Client
 *
 * Use Cases for AI operations including:
 * - Conversation management (create, list, get, update, delete, close, archive)
 * - Message management (send, list, delete, stream)
 * - AI Generation (goal, key results)
 * - Goal decomposition using LLMs
 * - Quota management
 * - Provider configuration
 */

export {
  // Conversation
  CreateConversation,
  ListConversations,
  GetConversation,
  UpdateConversation,
  DeleteConversation,
  CloseConversation,
  ArchiveConversation,
  
  // Message
  SendMessage,
  ListMessages,
  DeleteMessage,
  StreamChat,
  
  // Generation
  GenerateGoal,
  GenerateGoalWithKeyResults,
  AIGenerateKeyResults,
  
  // Quota
  GetQuota,
  CheckQuotaAvailability,
  
  // Provider
  ListProviders,
  CreateProvider,
  TestProviderConnection,
  SetDefaultProvider,
} from './services';
export * from './interfaces/IAIService';
export { AIServiceFactory } from './AIServiceFactory';
