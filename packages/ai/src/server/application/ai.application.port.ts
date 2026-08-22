import type { Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type {
  AICapabilities,
  AIConversationClientDTO,
  ConversationListRes,
  UpdateConversationReq,
  UpdateConversationRes,
  CreateAIProviderConfigReq,
  CreateAIProviderConfigRes,
  UpdateAIProviderConfigReq,
  UpdateAIProviderConfigRes,
  TestAIProviderReq,
  TestAIProviderRes,
  AIProviderConfigClientDTO,
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

/**
 * Transport-neutral product surface that remains outside Mastra execution.
 *
 * AI-VNEXT-07 deliberately excludes open-chat execution, AgentRun/Proposal,
 * goal-generation and LangGraph checkpoint methods. Assistant and durable
 * workflow execution cross the host boundary only through the canonical
 * Mastra runtime transports.
 */
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

  // Conversation product shell. Message history/execution is Mastra-owned.
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

  // Deterministic/product knowledge services that are not Agent runtime state.
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
}
