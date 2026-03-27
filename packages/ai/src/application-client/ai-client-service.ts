/**
 * AI Client Service — thin facade over API client ports.
 * AI 客户端服务 —— API 客户端端口的薄门面。
 *
 * This is the single entry point for UI layers to interact with the AI module.
 * All methods delegate directly to the underlying API client adapters.
 *
 * 这是 UI 层与 AI 模块交互的唯一入口。
 * 所有方法直接委托给底层 API 客户端适配器。
 */

import type {
  IAICapabilitiesApiClient,
  AIEvaluationReportApiClient,
  AIAnalyticsQueryApiClient,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  IAIGoalApiClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIProviderConfigApiClient,
} from '../infrastructure-client/adapters/types';
import type {
  CreateAIProviderConfigReq,
  CreateConversationReq,
  CreateKnowledgeNoteReq,
  GenerateGoalAutomationReq,
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
} from '@dailyuse/contracts/ai';

/**
 * Thin facade over AI API client ports for UI consumption.
 * 供 UI 层使用的 AI API 客户端端口薄门面。
 */
export class AIClientService {
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
    this.generateGoal = this.generateGoal.bind(this);
    this.automateGoal = this.automateGoal.bind(this);
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

  generateGoal(request: GenerateGoalsReq) {
    return this.goalApi.generateGoal(request);
  }

  automateGoal(request: GenerateGoalAutomationReq) {
    return this.goalApi.automateGoal(request);
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
  ) {
    return this.messageApi.streamMessage(request, handlers);
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
}
