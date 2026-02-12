/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

import type {
  AIConversationClientDTO,
  ConversationListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  MessageClientDTO,
  MessageListResponse,
  SendMessageRequest,
  ChatStreamRequest,
  ChatStreamChunk,
  AIGenerationTaskClientDTO,
  GenerationTaskListResponse,
  CreateGenerationTaskRequest,
  GenerateGoalRequest,
  GenerateGoalResponse,
  GenerateGoalWithKRsRequest,
  GenerateGoalWithKRsResponse,
  GenerateKeyResultsResponse,
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  RefreshProviderModelsResponse,
  AIUsageQuotaClientDTO,
  UpdateQuotaLimitRequest,
} from '@dailyuse/contracts/ai';

// ============ Transport Client Interfaces ============

export interface IHttpClient {
  get<T>(url: string, options?: { params?: Record<string, unknown> }): Promise<T>;
  post<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  put<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  patch<T>(url: string, data?: unknown, options?: { params?: Record<string, unknown> }): Promise<T>;
  delete<T>(url: string, options?: { params?: Record<string, unknown> }): Promise<T>;
}

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interfaces ============

export interface IAIConversationApiClient {
  createConversation(request: CreateConversationRequest): Promise<AIConversationClientDTO>;
  getConversations(params?: { page?: number; pageSize?: number; status?: string }): Promise<ConversationListResponse>;
  getConversationById(uuid: string): Promise<AIConversationClientDTO>;
  updateConversation(uuid: string, request: UpdateConversationRequest): Promise<AIConversationClientDTO>;
  deleteConversation(uuid: string): Promise<void>;
  closeConversation(uuid: string): Promise<AIConversationClientDTO>;
  archiveConversation(uuid: string): Promise<AIConversationClientDTO>;
}

export interface IAIMessageApiClient {
  sendMessage(request: SendMessageRequest): Promise<MessageClientDTO>;
  getMessages(conversationUuid: string, params?: { page?: number; pageSize?: number }): Promise<MessageListResponse>;
  deleteMessage(uuid: string): Promise<void>;
  streamChat(request: ChatStreamRequest): AsyncGenerator<ChatStreamChunk, void, unknown>;
}

export interface IAIGenerationTaskApiClient {
  createGenerationTask(request: CreateGenerationTaskRequest): Promise<AIGenerationTaskClientDTO>;
  getGenerationTasks(params?: { page?: number; pageSize?: number; type?: string; status?: string }): Promise<GenerationTaskListResponse>;
  getGenerationTaskById(uuid: string): Promise<AIGenerationTaskClientDTO>;
  cancelGenerationTask(uuid: string): Promise<void>;
  retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO>;
  generateGoal(request: GenerateGoalRequest): Promise<GenerateGoalResponse>;
  generateGoalWithKeyResults(request: GenerateGoalWithKRsRequest): Promise<GenerateGoalWithKRsResponse>;
  generateKeyResults(goalUuid: string): Promise<GenerateKeyResultsResponse>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderRequest): Promise<AIProviderConfigClientDTO>;
  getProviders(): Promise<AIProviderConfigSummary[]>;
  getProviderById(uuid: string): Promise<AIProviderConfigClientDTO>;
  updateProvider(uuid: string, request: UpdateAIProviderRequest): Promise<AIProviderConfigClientDTO>;
  deleteProvider(uuid: string): Promise<void>;
  testConnection(request: TestAIProviderConnectionRequest): Promise<TestAIProviderConnectionResponse>;
  setDefaultProvider(uuid: string): Promise<void>;
  refreshModels(uuid: string): Promise<RefreshProviderModelsResponse>;
}

export interface IAIUsageQuotaApiClient {
  getQuota(): Promise<AIUsageQuotaClientDTO>;
  updateQuotaLimit(request: UpdateQuotaLimitRequest): Promise<AIUsageQuotaClientDTO>;
  checkQuotaAvailability(tokensNeeded: number): Promise<boolean>;
}
