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
  AICapabilities,
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
  MessageListRes,
  SendMessageReq,
  GenerateGoalsReq,
  GenerateGoalsRes,
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
  SetDefaultAIProviderReq,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  QueryAnalyticsReq,
  QueryAnalyticsRes,
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
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
  getBridge?: () =>
    | {
        on(channel: string, callback: (...args: unknown[]) => void): void;
        off(channel: string, callback: (...args: unknown[]) => void): void;
      }
    | undefined;
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
  streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: {
        userMessage: SendMessageRes['userMessage'];
        assistantMessage: SendMessageRes['assistantMessage'];
        tokenUsage: SendMessageRes['tokenUsage'];
        providerId: SendMessageRes['providerId'];
        processingTimeMs: number;
      }) => void;
    },
    signal?: AbortSignal,
  ): Promise<void>;
  getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes>;
}

export interface IAIStreamMessageApiClient {
  cancelStream(streamId: string): Promise<void>;
  streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: {
        userMessage: SendMessageRes['userMessage'];
        assistantMessage: SendMessageRes['assistantMessage'];
        tokenUsage: SendMessageRes['tokenUsage'];
        providerId: SendMessageRes['providerId'];
        processingTimeMs: number;
      }) => void;
    },
    signal?: AbortSignal,
  ): Promise<void>;
}

export interface IAIGoalApiClient {
  generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes>;
}

export interface IAICapabilitiesApiClient {
  getCapabilities(): Promise<AICapabilities>;
}

export interface AIEvaluationReportApiClient {
  getEvaluationOverview(request?: GetAIEvaluationOverviewReq): Promise<GetAIEvaluationOverviewRes>;
}

export interface AIKnowledgeNoteApiClient {
  createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes>;
}

export interface AIKnowledgeQueryApiClient {
  expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes>;
  queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes>;
  reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes>;
}

export interface AIAnalyticsQueryApiClient {
  queryAnalytics(request: QueryAnalyticsReq): Promise<QueryAnalyticsRes>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderConfigReq): Promise<AIProviderConfigClientDTO>;
  getProviders(): Promise<AIProviderConfigClientDTO[]>;
  getProviderById(id: string): Promise<AIProviderConfigClientDTO>;
  updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO>;
  deleteProvider(id: string): Promise<void>;
  testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(request: SetDefaultAIProviderReq): Promise<void>;
  refreshProviderModels(id: string): Promise<AIProviderConfigClientDTO>;
}
