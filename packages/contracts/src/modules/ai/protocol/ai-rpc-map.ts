/**
 * AI RPC Map
 *
 * Defines RPC operations for AI module
 */
import type {
  GenerateGoalsReq,
  GenerateGoalsRes,
  RefineGoalReq,
  RefineGoalRes,
  GenerateTasksReq,
  GenerateTasksRes,
  KnowledgeGenerationReq,
  KnowledgeGenerationRes,
  SummarizationReq,
  SummarizationRes,
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  RefreshProviderModelsReq,
  RefreshProviderModelsRes,
  CreateConversationReq,
  CreateConversationRes,
  UpdateConversationReq,
  UpdateConversationRes,
  ListConversationsQuery,
  ConversationListRes,
  GetConversationReq,
  GetConversationRes,
  DeleteConversationReq,
  DeleteConversationRes,
  SendMessageReq,
  SendMessageRes,
  ListMessagesQuery,
  MessageListRes,
  ChatStreamReq,
  ChatStreamChunk,
  DeleteMessageReq,
  DeleteMessageRes,
  GetQuotaReq,
  GetQuotaRes,
  UpdateQuotaLimitReq,
  UpdateQuotaLimitRes,
  CheckQuotaAvailabilityReq,
  CheckQuotaAvailabilityRes,
} from '../api';

export type AIRpcMap = {
  // Goal Generation
  'ai:generate-goal': [GenerateGoalsReq, GenerateGoalsRes];
  'ai:refine-goal': [RefineGoalReq, RefineGoalRes];

  // Task Generation
  'ai:generate-tasks': [GenerateTasksReq, GenerateTasksRes];

  // Knowledge & Summarization
  'ai:generate-knowledge': [KnowledgeGenerationReq, KnowledgeGenerationRes];
  'ai:summarize': [SummarizationReq, SummarizationRes];

  // Provider Configuration
  'ai:create-provider-config': [CreateAIProviderConfigReq, CreateAIProviderConfigRes];
  'ai:update-provider-config': [UpdateAIProviderConfigReq, UpdateAIProviderConfigRes];
  'ai:test-provider': [TestAIProviderReq, TestAIProviderRes];
  'ai:refresh-provider-models': [RefreshProviderModelsReq, RefreshProviderModelsRes];

  // Conversations
  'ai:create-conversation': [CreateConversationReq, CreateConversationRes];
  'ai:update-conversation': [UpdateConversationReq, UpdateConversationRes];
  'ai:list-conversations': [ListConversationsQuery, ConversationListRes];
  'ai:get-conversation': [GetConversationReq, GetConversationRes];
  'ai:delete-conversation': [DeleteConversationReq, DeleteConversationRes];

  // Messages
  'ai:send-message': [SendMessageReq, SendMessageRes];
  'ai:list-messages': [ListMessagesQuery, MessageListRes];
  'ai:chat-stream': [ChatStreamReq, ChatStreamChunk];
  'ai:delete-message': [DeleteMessageReq, DeleteMessageRes];

  // Quota
  'ai:get-quota': [GetQuotaReq, GetQuotaRes];
  'ai:update-quota-limit': [UpdateQuotaLimitReq, UpdateQuotaLimitRes];
  'ai:check-quota': [CheckQuotaAvailabilityReq, CheckQuotaAvailabilityRes];
};
