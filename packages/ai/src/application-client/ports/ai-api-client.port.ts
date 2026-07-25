/**
 * AI API Client Ports
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

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
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
  AssistantClientCommand,
  AssistantEvent,
} from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

export interface IAIConversationApiClient {
  createConversation(request: CreateConversationReq): Promise<Result<AIConversationClientDTO>>;
  updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<Result<AIConversationClientDTO>>;
  getConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<Result<ConversationListRes>>;
  getConversationById(id: string): Promise<Result<AIConversationClientDTO>>;
  deleteConversation(id: string): Promise<Result<void>>;
}

export interface IAIMessageApiClient {
  sendMessage(request: SendMessageReq): Promise<Result<SendMessageRes>>;
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
  ): Promise<Result<MessageListRes>>;
}

export interface IAIGoalApiClient {
  generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>>;
}

export interface IAICapabilitiesApiClient {
  getCapabilities(): Promise<Result<AICapabilities>>;
}

export interface AIEvaluationReportApiClient {
  getEvaluationOverview(
    request?: GetAIEvaluationOverviewReq,
  ): Promise<Result<GetAIEvaluationOverviewRes>>;
}

export interface AIKnowledgeNoteApiClient {
  createKnowledgeNote(
    request: CreateKnowledgeNoteReq,
  ): Promise<Result<CreateKnowledgeNoteRes>>;
}

export interface AIKnowledgeQueryApiClient {
  expandKnowledge(request: ExpandKnowledgeReq): Promise<Result<ExpandKnowledgeRes>>;
  queryKnowledge(request: QueryKnowledgeReq): Promise<Result<QueryKnowledgeRes>>;
  reindexKnowledge(request: ReindexKnowledgeReq): Promise<Result<ReindexKnowledgeRes>>;
}

export interface AIAnalyticsQueryApiClient {
  queryAnalytics(request: QueryAnalyticsReq): Promise<Result<QueryAnalyticsRes>>;
}

export interface AIAgentRuntimeApiClient {
  listAgentRuns(params?: AgentRunListParams): Promise<Result<AgentRun[]>>;
  startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>>;
  resumeAgentRun(runId: string, payload: AgentResumePayload): Promise<Result<AgentRunResult>>;
  getAgentRun(runId: string): Promise<Result<AgentRunResult>>;
  getAgentEvents(runId: string): Promise<Result<AgentEvent[]>>;
}

export interface IAIProviderConfigApiClient {
  createProvider(request: CreateAIProviderConfigReq): Promise<Result<AIProviderConfigClientDTO>>;
  getProviders(): Promise<Result<AIProviderConfigClientDTO[]>>;
  getProviderById(id: string): Promise<Result<AIProviderConfigClientDTO>>;
  updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>>;
  deleteProvider(id: string): Promise<Result<void>>;
  testConnection(request: TestAIProviderReq): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(request: SetDefaultAIProviderReq): Promise<Result<void>>;
  refreshProviderModels(id: string): Promise<Result<AIProviderConfigClientDTO>>;
}

export interface IAIAssistantApiClient {
  /**
   * Dispatch AssistantFacade command over transport SSE/stream.
   * identityId is never part of the client body.
   */
  dispatchAssistant(
    command: AssistantClientCommand,
    handlers: {
      onEvent?: (event: AssistantEvent) => void;
      onDone?: (result: { eventCount: number }) => void;
    },
    signal?: AbortSignal,
  ): Promise<void>;
}

