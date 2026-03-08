/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

export type { IHttpClient } from '@dailyuse/http-client';
export type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
  MessageClientDTO,
  MessageListRes,
  SendMessageReq,
  GenerateGoalsReq,
  GenerateGoalsRes,
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  SetDefaultAIProviderReq,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  SendMessageRes,
} from '@dailyuse/contracts/ai';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

export interface IResultIpcClient {
  invoke<T = unknown>(
    channel: string,
    ...args: unknown[]
  ): Promise<import('@dailyuse/contracts/result').Result<T>>;
}

// ============ Port Interfaces ============

export interface IAIConversationApiClient {
  createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO>;
  updateConversation(id: string, request: UpdateConversationReq): Promise<AIConversationClientDTO>;
  getConversations(params?: { page?: number; pageSize?: number }): Promise<ConversationListRes>;
  getConversationById(id: string): Promise<AIConversationClientDTO>;
  deleteConversation(id: string): Promise<void>;
}

export interface IAIMessageApiClient {
  sendMessage(request: SendMessageReq): Promise<SendMessageRes>;
  getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes>;
}

export interface IAIGoalApiClient {
  generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes>;
}

export interface AIKnowledgeNoteApiClient {
  createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  getProviders(): Promise<AIProviderConfigSummary[]>;
  getProviderById(id: string): Promise<AIProviderConfigClientDTO>;
  updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO>;
  deleteProvider(id: string): Promise<void>;
  testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void>;
}
