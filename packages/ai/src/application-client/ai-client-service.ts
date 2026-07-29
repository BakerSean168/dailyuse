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
} from '@memoflow/contracts/ai';

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
    const request: SetDefaultAIProviderReq = { providerId: providerId as SetDefaultAIProviderReq['providerId'] };
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
    handlers: Parameters<IAIAssistantApiClient['dispatchAssistant']>[1],
    signal?: AbortSignal,
  ) {
    return this.assistantApi.dispatchAssistant(command, handlers, signal);
  }
}

// ===== Factory =====

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
  );
}
