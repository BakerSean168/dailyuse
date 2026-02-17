/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

export type { IHttpClient } from '@dailyuse/http-client';
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
  StartGenerationTaskReq,
  GenerateGoalsReq,
  GenerateGoalsRes,
  GenerateTasksRes,
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

export interface GenerationTaskListRes {
  data: AIGenerationTaskClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateGenerationTaskReq = StartGenerationTaskReq;
export type GenerateGoalReq = GenerateGoalsReq;
export type GenerateGoalRes = GenerateGoalsRes;
export type GenerateKeyResultsRes = GenerateTasksRes;

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interfaces ============

export interface IAIConversationApiClient {
  createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO>;
  getConversations(params?: { page?: number; pageSize?: number; status?: string }): Promise<ConversationListRes>;
  getConversationById(id: string): Promise<AIConversationClientDTO>;
  updateConversation(id: string, request: UpdateConversationReq): Promise<AIConversationClientDTO>;
  deleteConversation(id: string): Promise<void>;
  closeConversation(id: string): Promise<AIConversationClientDTO>;
  archiveConversation(id: string): Promise<AIConversationClientDTO>;
}

export interface IAIMessageApiClient {
  sendMessage(request: SendMessageReq): Promise<MessageClientDTO>;
  getMessages(conversationId: string, params?: { page?: number; pageSize?: number }): Promise<MessageListRes>;
  deleteMessage(id: string): Promise<void>;
  streamChat(request: ChatStreamReq): AsyncGenerator<ChatStreamChunk, void, unknown>;
}

export interface IAIGenerationTaskApiClient {
  createGenerationTask(request: CreateGenerationTaskReq): Promise<AIGenerationTaskClientDTO>;
  getGenerationTasks(params?: { page?: number; pageSize?: number; type?: string; status?: string }): Promise<GenerationTaskListRes>;
  getGenerationTaskById(id: string): Promise<AIGenerationTaskClientDTO>;
  cancelGenerationTask(id: string): Promise<void>;
  retryGenerationTask(id: string): Promise<AIGenerationTaskClientDTO>;
  generateGoal(request: GenerateGoalReq): Promise<GenerateGoalRes>;
  generateGoalWithKeyResults(request: GenerateGoalReq): Promise<GenerateGoalRes>;
  generateKeyResults(goalId: string): Promise<GenerateKeyResultsRes>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  getProviders(): Promise<AIProviderConfigSummary[]>;
  getProviderById(id: string): Promise<AIProviderConfigClientDTO>;
  updateProvider(id: string, request: UpdateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  deleteProvider(id: string): Promise<void>;
  testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(id: string): Promise<void>;
  refreshModels(id: string): Promise<RefreshProviderModelsRes>;
}

export interface IAIUsageQuotaApiClient {
  getQuota(): Promise<AIUsageQuotaClientDTO>;
  updateQuotaLimit(request: UpdateQuotaLimitReq): Promise<AIUsageQuotaClientDTO>;
  checkQuotaAvailability(tokensNeeded: number): Promise<boolean>;
}
