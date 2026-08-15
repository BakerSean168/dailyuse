import type { Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type {
  AICapabilities,
  AgentEvent,
  AgentResumePayload,
  AgentRun,
  AgentRunListParams,
  AgentRunResult,
  AgentStartRunRequest,
  AssistantCommand,
  AssistantEvent,
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
} from '@memoflow/contracts/ai';
import type { IAgentCheckpointPort, ILangGraphCheckpointPort } from './ports';

/**
 * Transport-neutral callable application surface.
 * 传输无关的可调用应用表面。
 */
export interface AIApplicationPort {
  getCapabilities(): Promise<Result<AICapabilities>>;

  /**
   * Optional internal checkpoint surface (API / Prisma lane only).
   * 可选内部 checkpoint surface（仅 API / Prisma lane）。
   *
   * Present only when the host supplies the all-or-none checkpoint pair.
   * Desktop supplies neither port, so this stays `undefined` there. The API
   * transport wires both internal checkpoint controllers from this nested
   * surface instead of constructing database adapters directly.
   *
   * 仅当宿主提供完整的 checkpoint pair 时存在。Desktop 两者都不提供，因此这里为
   * `undefined`。API transport 从此嵌套 surface 接线两个内部 checkpoint
   * controller，而不是直接构造数据库适配器。
   */
  readonly checkpoints?: {
    readonly agent: IAgentCheckpointPort;
    readonly langGraph: ILangGraphCheckpointPort;
  };

  // Provider config
  createProvider(
    req: CreateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateAIProviderConfigRes>>;
  updateProvider(
    id: string,
    req: UpdateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateAIProviderConfigRes>>;
  deleteProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  getProvider(id: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>>;
  listProviders(cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO[]>>;
  testConnection(req: TestAIProviderReq, cx: ExecutionContext): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  refreshProviderModels(
    providerId: string,
    cx: ExecutionContext,
  ): Promise<Result<AIProviderConfigClientDTO>>;

  // Conversations
  createConversation(cx: ExecutionContext, name?: string): Promise<Result<AIConversationClientDTO>>;
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
  generateGoal(
    params: GenerateGoalsReq & { identityId: string; requestId?: string },
  ): Promise<Result<GenerateGoalsRes>>;

  // Knowledge, analytics, and agent runtime
  createKnowledgeNote(
    req: CreateKnowledgeNoteReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateKnowledgeNoteRes>>;
  expandKnowledge(
    req: ExpandKnowledgeReq,
    cx: ExecutionContext,
  ): Promise<Result<ExpandKnowledgeRes>>;
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

  /**
   * AssistantFacade dispatch (residual 345). Streams Host-normalized AssistantEvent.
   * Callers must set identityId from trusted ExecutionContext before invoking.
   *
   * @param requestId - Optional entry correlation request ID to propagate into the
   *                    Turn Engine (open chat reaches Python with the same ID).
   */
  dispatchAssistant(
    command: AssistantCommand,
    onEvent: (event: AssistantEvent) => void,
    signal?: AbortSignal,
    requestId?: string,
  ): Promise<Result<{ eventCount: number }>>;
}
