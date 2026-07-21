import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  AICapabilities,
  AgentEvent,
  AgentResumePayload,
  AgentRun,
  AgentRunListParams,
  AgentRunResult,
  AgentStartRunRequest,
  AIConversationClientDTO,
  ConversationListRes,
  SendMessageRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
  UpdateConversationReq,
  UpdateConversationRes,
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  AIProviderConfigClientDTO,
  CreateKnowledgeNoteReq,
  CreateKnowledgeNoteRes,
  ExpandKnowledgeReq,
  ExpandKnowledgeRes,
  QueryAnalyticsReq,
  QueryAnalyticsRes,
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
  QueryKnowledgeReq,
  QueryKnowledgeRes,
  ReindexKnowledgeReq,
  ReindexKnowledgeRes,
} from '@dailyuse/contracts/ai';

/** Transport-neutral callable application surface. */
export interface AIApplicationPort {
  getCapabilities(): Promise<Result<AICapabilities>>;

  // Provider config
  createProvider(
    req: CreateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateAIProviderConfigRes>>;
  updateProvider(
    id: string,
    req: UpdateAIProviderConfigReq,
  ): Promise<Result<UpdateAIProviderConfigRes>>;
  deleteProvider(id: string): Promise<Result<void>>;
  getProvider(id: string): Promise<Result<AIProviderConfigClientDTO>>;
  listProviders(cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO[]>>;
  testConnection(req: TestAIProviderReq, cx: ExecutionContext): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  refreshProviderModels(
    providerId: string,
    cx: ExecutionContext,
  ): Promise<Result<AIProviderConfigClientDTO>>;

  // Conversations
  createConversation(
    cx: ExecutionContext,
    name?: string,
  ): Promise<Result<AIConversationClientDTO>>;
  updateConversation(
    id: string,
    req: UpdateConversationReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateConversationRes>>;
  listConversations(
    cx: ExecutionContext,
    page?: number,
    pageSize?: number,
  ): Promise<Result<ConversationListRes>>;
  getConversation(
    id: string,
    cx: ExecutionContext,
    includeMessages?: boolean,
  ): Promise<Result<AIConversationClientDTO | null>>;
  deleteConversation(id: string, cx: ExecutionContext): Promise<Result<void>>;

  // Chat
  sendMessage(
    conversationId: string,
    content: string,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
  ): Promise<Result<SendMessageRes>>;
  streamMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
    signal?: AbortSignal,
  ): Promise<
    Result<{
      userMessage: SendMessageRes['userMessage'];
      assistantMessage: SendMessageRes['assistantMessage'];
      tokenUsage: SendMessageRes['tokenUsage'];
      providerId: SendMessageRes['providerId'];
      processingTimeMs: number;
    }>
  >;

  // Goal generation
  generateGoal(params: GenerateGoalsReq & { identityId: string }): Promise<Result<GenerateGoalsRes>>;

  // Knowledge, analytics, and agent runtime
  createKnowledgeNote(
    req: CreateKnowledgeNoteReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateKnowledgeNoteRes>>;
  expandKnowledge(req: ExpandKnowledgeReq, cx: ExecutionContext): Promise<Result<ExpandKnowledgeRes>>;
  queryKnowledge(req: QueryKnowledgeReq, cx: ExecutionContext): Promise<Result<QueryKnowledgeRes>>;
  reindexKnowledge(
    req: ReindexKnowledgeReq,
    cx: ExecutionContext,
  ): Promise<Result<ReindexKnowledgeRes>>;
  queryAnalytics(req: QueryAnalyticsReq, cx: ExecutionContext): Promise<Result<QueryAnalyticsRes>>;
  getEvaluationOverview(
    req?: GetAIEvaluationOverviewReq,
  ): Promise<Result<GetAIEvaluationOverviewRes>>;
  startAgentRun(
    req: AgentStartRunRequest,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  resumeAgentRun(
    runId: string,
    payload: AgentResumePayload,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  getAgentRun(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRunResult>>;
  listAgentRuns(
    params: AgentRunListParams,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentRun[]>>;
  getAgentEvents(
    runId: string,
    cx: ExecutionContext,
    requestId?: string,
    signal?: AbortSignal,
  ): Promise<Result<AgentEvent[]>>;
}
