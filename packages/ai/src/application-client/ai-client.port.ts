import type {
  AICapabilities,
  AIConversationClientDTO,
  ConversationListRes,
  CreateConversationReq,
  UpdateConversationReq,
  MessageListRes,
  SendMessageReq,
  SendMessageRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
  AIProviderConfigClientDTO,
  CreateAIProviderConfigReq,
  UpdateAIProviderConfigReq,
  TestAIProviderReq,
  TestAIProviderRes,
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
  AgentEvent,
  AgentRun,
  AgentRunListParams,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

export interface AIClientPort {
  getCapabilities(): Promise<AICapabilities>;
  getEvaluationOverview(request?: GetAIEvaluationOverviewReq): Promise<GetAIEvaluationOverviewRes>;

  createProvider(request: CreateAIProviderConfigReq): Promise<Result<AIProviderConfigClientDTO>>;
  updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<Result<AIProviderConfigClientDTO>>;
  listProviders(): Promise<Result<AIProviderConfigClientDTO[]>>;
  getProvider(id: string): Promise<Result<AIProviderConfigClientDTO>>;
  deleteProvider(id: string): Promise<Result<void>>;
  testProvider(request: TestAIProviderReq): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(providerId: string): Promise<Result<void>>;
  refreshProviderModels(id: string): Promise<Result<AIProviderConfigClientDTO>>;

  generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes>;

  createConversation(request: CreateConversationReq): Promise<AIConversationClientDTO>;
  updateConversation(id: string, request: UpdateConversationReq): Promise<AIConversationClientDTO>;
  listConversations(params?: { page?: number; pageSize?: number }): Promise<ConversationListRes>;
  getConversation(id: string): Promise<AIConversationClientDTO>;
  deleteConversation(id: string): Promise<void>;

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
  listMessages(conversationId: string, params?: { page?: number; pageSize?: number }): Promise<MessageListRes>;

  queryKnowledge(request: QueryKnowledgeReq): Promise<QueryKnowledgeRes>;
  expandKnowledge(request: ExpandKnowledgeReq): Promise<ExpandKnowledgeRes>;
  reindexKnowledge(request: ReindexKnowledgeReq): Promise<ReindexKnowledgeRes>;
  createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<CreateKnowledgeNoteRes>;

  queryAnalytics(request: QueryAnalyticsReq): Promise<QueryAnalyticsRes>;

  listAgentRuns(params?: AgentRunListParams): Promise<AgentRun[]>;
  startAgentRun(request: AgentStartRunClientRequest): Promise<AgentRunResult>;
  resumeAgentRun(runId: string, payload: AgentResumePayload): Promise<AgentRunResult>;
  getAgentRun(runId: string): Promise<AgentRunResult>;
  getAgentEvents(runId: string): Promise<AgentEvent[]>;
}
