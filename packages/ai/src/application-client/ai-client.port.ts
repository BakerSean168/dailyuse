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
  AssistantClientCommand,
  AssistantDispatchHandlers,
} from '@memoflow/contracts/ai';
import type { Result } from '@memoflow/contracts/result';

export interface AIClientPort {
  getCapabilities(): Promise<Result<AICapabilities>>;
  getEvaluationOverview(request?: GetAIEvaluationOverviewReq): Promise<Result<GetAIEvaluationOverviewRes>>;

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

  generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>>;

  createConversation(request: CreateConversationReq): Promise<Result<AIConversationClientDTO>>;
  updateConversation(
    id: string,
    request: UpdateConversationReq,
  ): Promise<Result<AIConversationClientDTO>>;
  listConversations(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<Result<ConversationListRes>>;
  getConversation(id: string): Promise<Result<AIConversationClientDTO>>;
  deleteConversation(id: string): Promise<Result<void>>;

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
  listMessages(conversationId: string, params?: { page?: number; pageSize?: number }): Promise<Result<MessageListRes>>;

  queryKnowledge(request: QueryKnowledgeReq): Promise<Result<QueryKnowledgeRes>>;
  expandKnowledge(request: ExpandKnowledgeReq): Promise<Result<ExpandKnowledgeRes>>;
  reindexKnowledge(request: ReindexKnowledgeReq): Promise<Result<ReindexKnowledgeRes>>;
  createKnowledgeNote(request: CreateKnowledgeNoteReq): Promise<Result<CreateKnowledgeNoteRes>>;

  queryAnalytics(request: QueryAnalyticsReq): Promise<Result<QueryAnalyticsRes>>;

  listAgentRuns(params?: AgentRunListParams): Promise<Result<AgentRun[]>>;
  startAgentRun(request: AgentStartRunClientRequest): Promise<Result<AgentRunResult>>;
  resumeAgentRun(runId: string, payload: AgentResumePayload): Promise<Result<AgentRunResult>>;
  getAgentRun(runId: string): Promise<Result<AgentRunResult>>;
  getAgentEvents(runId: string): Promise<Result<AgentEvent[]>>;

  /**
   * Residual 347: AssistantFacade client dispatch (no identityId in body).
   * Handlers use the frozen `AssistantDispatchHandlers`; onDone receives the
   * named `AssistantDispatchResult`. identityId never appears in the body.
   *
   * Residual 347：AssistantFacade 客户端分发（body 不含 identityId）。
   * handlers 使用冻结的 `AssistantDispatchHandlers`；onDone 收到命名类型
   * `AssistantDispatchResult`。identityId 永远不会出现在 body。
   */
  dispatchAssistant(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ): Promise<void>;
}
