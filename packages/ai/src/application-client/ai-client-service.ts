/**
 * AI Client Service — thin facade over API client ports.
 * AI 客户端服务 —— API 客户端端口的薄门面。
 *
 * This is the single entry point for UI layers to interact with the AI module.
 * All methods delegate directly to the underlying API client adapters.
 *
 * AI client ports return Result envelopes (residual 96–100). streamMessage remains
 * throw-based for SSE/IPC stream control flow.
 *
 * 这是 UI 层与 AI 模块交互的唯一入口。
 * 所有方法直接委托给底层 API 客户端适配器。
 */

import type {
  IAICapabilitiesApiClient,
  AIAgentRuntimeApiClient,
  AIEvaluationReportApiClient,
  AIAnalyticsQueryApiClient,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  IAIGoalApiClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIProviderConfigApiClient,
  IAIAssistantApiClient,
} from './ports/ai-api-client.port';
import type {
  CreateAIProviderConfigReq,
  CreateConversationReq,
  CreateKnowledgeNoteReq,
  GenerateGoalsReq,
  GetAIEvaluationOverviewReq,
  ExpandKnowledgeReq,
  QueryAnalyticsReq,
  QueryKnowledgeReq,
  ReindexKnowledgeReq,
  SendMessageReq,
  SetDefaultAIProviderReq,
  TestAIProviderReq,
  UpdateConversationReq,
  UpdateAIProviderConfigReq,
  AgentResumePayload,
  AgentRunListParams,
  AgentStartRunClientRequest,
  AssistantClientCommand,
  AssistantDispatchHandlers,
} from '@memoflow/contracts/ai';
import {
  classifyAssistantDispatchFallback,
  DEFAULT_ASSISTANT_DISPATCH_POLICY,
  type AssistantDispatchObservedState,
  type AssistantDispatchPolicy,
} from './assistant-dispatch-policy';
import { createResultClientError } from '../infrastructure-client/adapters/result-client-error';

/**
 * Thin facade over AI API client ports for UI consumption.
 * 供 UI 层使用的 AI API 客户端端口薄门面。
 */
import type { AIClientPort } from './ai-client.port';

export class AIClientService implements AIClientPort {
  constructor(
    private readonly capabilitiesApi: IAICapabilitiesApiClient,
    private readonly evaluationReportApi: AIEvaluationReportApiClient,
    private readonly providerApi: IAIProviderConfigApiClient,
    private readonly conversationApi: IAIConversationApiClient,
    private readonly messageApi: IAIMessageApiClient,
    private readonly goalApi: IAIGoalApiClient,
    private readonly knowledgeQueryApi: AIKnowledgeQueryApiClient,
    private readonly knowledgeNoteApi: AIKnowledgeNoteApiClient,
    private readonly analyticsQueryApi: AIAnalyticsQueryApiClient,
    private readonly agentRuntimeApi: AIAgentRuntimeApiClient,
    private readonly assistantApi: IAIAssistantApiClient,
    private readonly dispatchPolicy: AssistantDispatchPolicy = DEFAULT_ASSISTANT_DISPATCH_POLICY,
  ) {
    this.getCapabilities = this.getCapabilities.bind(this);
    this.getEvaluationOverview = this.getEvaluationOverview.bind(this);
    this.createProvider = this.createProvider.bind(this);
    this.updateProvider = this.updateProvider.bind(this);
    this.listProviders = this.listProviders.bind(this);
    this.getProvider = this.getProvider.bind(this);
    this.deleteProvider = this.deleteProvider.bind(this);
    this.testProvider = this.testProvider.bind(this);
    this.setDefaultProvider = this.setDefaultProvider.bind(this);
    this.refreshProviderModels = this.refreshProviderModels.bind(this);
    this.generateGoal = this.generateGoal.bind(this);
    this.createConversation = this.createConversation.bind(this);
    this.updateConversation = this.updateConversation.bind(this);
    this.listConversations = this.listConversations.bind(this);
    this.getConversation = this.getConversation.bind(this);
    this.deleteConversation = this.deleteConversation.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.streamMessage = this.streamMessage.bind(this);
    this.listMessages = this.listMessages.bind(this);
    this.queryKnowledge = this.queryKnowledge.bind(this);
    this.expandKnowledge = this.expandKnowledge.bind(this);
    this.reindexKnowledge = this.reindexKnowledge.bind(this);
    this.createKnowledgeNote = this.createKnowledgeNote.bind(this);
    this.queryAnalytics = this.queryAnalytics.bind(this);
    this.listAgentRuns = this.listAgentRuns.bind(this);
    this.startAgentRun = this.startAgentRun.bind(this);
    this.resumeAgentRun = this.resumeAgentRun.bind(this);
    this.getAgentRun = this.getAgentRun.bind(this);
    this.getAgentEvents = this.getAgentEvents.bind(this);
    this.dispatchAssistant = this.dispatchAssistant.bind(this);
  }

  getCapabilities() {
    return this.capabilitiesApi.getCapabilities();
  }

  getEvaluationOverview(request?: GetAIEvaluationOverviewReq) {
    return this.evaluationReportApi.getEvaluationOverview(request);
  }

  createProvider(request: CreateAIProviderConfigReq) {
    return this.providerApi.createProvider(request);
  }

  updateProvider(id: string, request: UpdateAIProviderConfigReq) {
    return this.providerApi.updateProvider(id, request);
  }

  listProviders() {
    return this.providerApi.getProviders();
  }

  getProvider(id: string) {
    return this.providerApi.getProviderById(id);
  }

  deleteProvider(id: string) {
    return this.providerApi.deleteProvider(id);
  }

  testProvider(request: TestAIProviderReq) {
    return this.providerApi.testConnection(request);
  }

  setDefaultProvider(providerId: string) {
    const request: SetDefaultAIProviderReq = {
      providerId: providerId as SetDefaultAIProviderReq['providerId'],
    };
    return this.providerApi.setDefaultProvider(request);
  }

  refreshProviderModels(id: string) {
    return this.providerApi.refreshProviderModels(id);
  }

  generateGoal(request: GenerateGoalsReq) {
    return this.goalApi.generateGoal(request);
  }

  createConversation(request: CreateConversationReq) {
    return this.conversationApi.createConversation(request);
  }

  updateConversation(id: string, request: UpdateConversationReq) {
    return this.conversationApi.updateConversation(id, request);
  }

  listConversations(params?: { page?: number; pageSize?: number }) {
    return this.conversationApi.getConversations(params);
  }

  getConversation(id: string) {
    return this.conversationApi.getConversationById(id);
  }

  deleteConversation(id: string) {
    return this.conversationApi.deleteConversation(id);
  }

  sendMessage(request: SendMessageReq) {
    return this.messageApi.sendMessage(request);
  }

  streamMessage(
    request: SendMessageReq,
    handlers: Parameters<IAIMessageApiClient['streamMessage']>[1],
    signal?: AbortSignal,
  ) {
    return this.messageApi.streamMessage(request, handlers, signal);
  }

  listMessages(conversationId: string, params?: { page?: number; pageSize?: number }) {
    return this.messageApi.getMessages(conversationId, params);
  }

  queryKnowledge(request: QueryKnowledgeReq) {
    return this.knowledgeQueryApi.queryKnowledge(request);
  }

  expandKnowledge(request: ExpandKnowledgeReq) {
    return this.knowledgeQueryApi.expandKnowledge(request);
  }

  reindexKnowledge(request: ReindexKnowledgeReq) {
    return this.knowledgeQueryApi.reindexKnowledge(request);
  }

  createKnowledgeNote(request: CreateKnowledgeNoteReq) {
    return this.knowledgeNoteApi.createKnowledgeNote(request);
  }

  queryAnalytics(request: QueryAnalyticsReq) {
    return this.analyticsQueryApi.queryAnalytics(request);
  }

  listAgentRuns(params?: AgentRunListParams) {
    return this.agentRuntimeApi.listAgentRuns(params);
  }

  startAgentRun(request: AgentStartRunClientRequest) {
    return this.agentRuntimeApi.startAgentRun(request);
  }

  resumeAgentRun(runId: string, payload: AgentResumePayload) {
    return this.agentRuntimeApi.resumeAgentRun(runId, payload);
  }

  getAgentRun(runId: string) {
    return this.agentRuntimeApi.getAgentRun(runId);
  }

  getAgentEvents(runId: string) {
    return this.agentRuntimeApi.getAgentEvents(runId);
  }

  dispatchAssistant(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ) {
    return this.dispatchAssistantWithPolicy(command, handlers, signal);
  }

  /**
   * Host dispatch is always the default (plan §4.5 / Step D). `legacy_only`
   * bypasses dispatch for direct-turn messages only; every other command fails
   * explicitly. `prefer_dispatch` falls back to `streamMessage` only when the
   * dispatch attempt is definitely unavailable AND produced zero events.
   *
   * Host dispatch 始终是默认（计划 §4.5 / Step D）。`legacy_only` 仅对
   * direct-turn message 绕过 dispatch；其余 command 明确失败。`prefer_dispatch`
   * 仅在 dispatch 明确不可用且未产出任何事件时回退 `streamMessage`。
   */
  private async dispatchAssistantWithPolicy(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    if (this.dispatchPolicy === 'legacy_only') {
      this.assertLegacyEligible(command);
      return this.dispatchLegacyProjection(command, handlers, signal);
    }

    const observed: AssistantDispatchObservedState = { sawEvent: false };
    try {
      await this.assistantApi.dispatchAssistant(
        command,
        {
          onEvent: (event) => {
            observed.sawEvent = true;
            handlers.onEvent?.(event);
          },
          onDone: (result) => handlers.onDone?.(result),
        },
        signal,
      );
      return;
    } catch (error) {
      if (this.dispatchPolicy === 'dispatch_only') {
        throw error;
      }
      if (classifyAssistantDispatchFallback(error, command, observed)) {
        return this.dispatchLegacyProjection(command, handlers, signal);
      }
      throw error;
    }
  }

  /**
   * `legacy_only` accepts only direct-turn message commands. pi_readonly and
   * proposal/cancel commands never reach the legacy message endpoint.
   *
   * `legacy_only` 只接受 direct-turn message command。pi_readonly 与
   * proposal/cancel command 永远不进入 legacy message endpoint。
   */
  private assertLegacyEligible(command: AssistantClientCommand): void {
    if (command.type !== 'message' || command.executionProfileId === 'pi_readonly') {
      throw createResultClientError(
        'Legacy-only host does not support this assistant command',
        'ASSISTANT_DISPATCH_UNSUPPORTED',
      );
    }
  }

  /**
   * Project a legacy `streamMessage` into the normalized dispatch event stream.
   * Preserves the command runId (generating one when omitted) and the persisted
   * message. NEVER fabricates a Host `run.started` — fallback visibility is
   * internal log/metric only (plan §4.3).
   *
   * 把 legacy `streamMessage` 投影为归一化 dispatch 事件流。保留 command
   * runId（缺省时生成一个）与持久化消息。绝不伪造 Host `run.started` ——
   * fallback 仅能通过内部 log/metric 观察（计划 §4.3）。
   */
  private async dispatchLegacyProjection(
    command: AssistantClientCommand,
    handlers: AssistantDispatchHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    if (command.type !== 'message') {
      throw createResultClientError(
        'Legacy projection requires a message command',
        'ASSISTANT_DISPATCH_UNSUPPORTED',
      );
    }
    const runId = command.runId ?? createFallbackDispatchRunId();
    const request: SendMessageReq = {
      conversationId: command.conversationId as SendMessageReq['conversationId'],
      content: command.content,
      providerId: command.providerId as SendMessageReq['providerId'] | undefined,
      model: command.model,
    };

    let eventCount = 0;
    await this.messageApi.streamMessage(
      request,
      {
        onChunk: (chunk) => {
          eventCount += 1;
          handlers.onEvent?.({
            type: 'message.delta',
            runId,
            content: chunk.content,
          });
        },
        onDone: (result) => {
          eventCount += 1;
          handlers.onEvent?.({
            type: 'message.completed',
            runId,
            status: 'completed',
            content: result.assistantMessage?.content,
            userMessage: result.userMessage
              ? { id: String(result.userMessage.id), content: result.userMessage.content }
              : undefined,
            assistantMessage: result.assistantMessage
              ? {
                  id: String(result.assistantMessage.id),
                  content: result.assistantMessage.content,
                }
              : undefined,
          });
          handlers.onDone?.({ eventCount });
        },
      },
      signal,
    );
  }
}

// ===== Factory =====

export interface CreateAIClientServiceOptions {
  /** Assistant dispatch rollout policy (plan §4.5). Defaults to prefer_dispatch. */
  dispatchPolicy?: AssistantDispatchPolicy;
}

export function createAIClientService(
  capabilitiesApi: IAICapabilitiesApiClient,
  evaluationReportApi: AIEvaluationReportApiClient,
  providerApi: IAIProviderConfigApiClient,
  conversationApi: IAIConversationApiClient,
  messageApi: IAIMessageApiClient,
  goalApi: IAIGoalApiClient,
  knowledgeQueryApi: AIKnowledgeQueryApiClient,
  knowledgeNoteApi: AIKnowledgeNoteApiClient,
  analyticsQueryApi: AIAnalyticsQueryApiClient,
  agentRuntimeApi: AIAgentRuntimeApiClient,
  assistantApi: IAIAssistantApiClient,
  options?: CreateAIClientServiceOptions,
): AIClientService {
  return new AIClientService(
    capabilitiesApi,
    evaluationReportApi,
    providerApi,
    conversationApi,
    messageApi,
    goalApi,
    knowledgeQueryApi,
    knowledgeNoteApi,
    analyticsQueryApi,
    agentRuntimeApi,
    assistantApi,
    options?.dispatchPolicy,
  );
}

/**
 * Client-owned fallback run id for legacy projections when the command did not
 * carry a runId (plan §4.2 keeps runId optional for existing callers). Never
 * persisted as a Host run; used only to correlate projected events.
 *
 * command 未携带 runId 时，legacy 投影使用的客户端 run id（计划 §4.2 对既有
 * 调用方保持 runId 可选）。它不是持久 Host run，仅用于关联投影事件。
 */
function createFallbackDispatchRunId(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  return `legacy:${random}`;
}
