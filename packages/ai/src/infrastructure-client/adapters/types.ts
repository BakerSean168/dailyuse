/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

import type { IHttpClient } from '@dailyuse/http-client';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
  MessageClientDTO,
  MessageListRes,
  SendMessageReq,
  ChatStreamReq,
  ChatStreamChunk,
  AIGenerationTaskClientDTO,
  GenerationTaskListRes,
  CreateGenerationTaskReq,
  GenerateGoalReq,
  GenerateGoalRes,
  GenerateKeyResultsRes,
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  RefreshProviderModelsRes,
  AIUsageQuotaClientDTO,
  UpdateQuotaLimitReq,
} from '@dailyuse/contracts/ai';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interfaces ============

export interface IAIConversationApiClient {
  createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO>;
  getConversations(params?: { page?: number; pageSize?: number; status?: string }): Promise<ConversationListRes>;
  getConversationById(uuid: string): Promise<AIConversationClientDTO>;
  updateConversation(uuid: string, request: UpdateConversationReq): Promise<AIConversationClientDTO>;
  deleteConversation(uuid: string): Promise<void>;
  closeConversation(uuid: string): Promise<AIConversationClientDTO>;
  archiveConversation(uuid: string): Promise<AIConversationClientDTO>;
}

export interface IAIMessageApiClient {
  sendMessage(request: SendMessageReq): Promise<MessageClientDTO>;
  getMessages(conversationUuid: string, params?: { page?: number; pageSize?: number }): Promise<MessageListRes>;
  deleteMessage(uuid: string): Promise<void>;
  streamChat(request: ChatStreamReq): AsyncGenerator<ChatStreamChunk, void, unknown>;
}

export interface IAIGenerationTaskApiClient {
  createGenerationTask(request: CreateGenerationTaskReq): Promise<AIGenerationTaskClientDTO>;
  getGenerationTasks(params?: { page?: number; pageSize?: number; type?: string; status?: string }): Promise<GenerationTaskListRes>;
  getGenerationTaskById(uuid: string): Promise<AIGenerationTaskClientDTO>;
  cancelGenerationTask(uuid: string): Promise<void>;
  retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO>;
  generateGoal(request: GenerateGoalReq): Promise<GenerateGoalRes>;
  generateGoalWithKeyResults(request: GenerateGoalReq): Promise<GenerateGoalRes>;
  generateKeyResults(goalUuid: string): Promise<GenerateKeyResultsRes>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  getProviders(): Promise<AIProviderConfigSummary[]>;
  getProviderById(uuid: string): Promise<AIProviderConfigClientDTO>;
  updateProvider(uuid: string, request: UpdateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  deleteProvider(uuid: string): Promise<void>;
  testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(uuid: string): Promise<void>;
  refreshModels(uuid: string): Promise<RefreshProviderModelsRes>;
}

export interface IAIUsageQuotaApiClient {
  getQuota(): Promise<AIUsageQuotaClientDTO>;
  updateQuotaLimit(request: UpdateQuotaLimitReq): Promise<AIUsageQuotaClientDTO>;
  checkQuotaAvailability(tokensNeeded: number): Promise<boolean>;
}
