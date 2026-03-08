import type {
  AIKnowledgeNoteApiClient,
  IAIGoalApiClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIProviderConfigApiClient,
} from '../infrastructure-client/adapters/types';
import type {
  CreateAIProviderConfigReq,
  CreateConversationReq,
  CreateKnowledgeNoteReq,
  GenerateGoalsReq,
  SendMessageReq,
  TestAIProviderReq,
  UpdateConversationReq,
  UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';

export class AIClientService {
  constructor(
    private readonly providerApi: IAIProviderConfigApiClient,
    private readonly conversationApi: IAIConversationApiClient,
    private readonly messageApi: IAIMessageApiClient,
    private readonly goalApi: IAIGoalApiClient,
    private readonly knowledgeNoteApi: AIKnowledgeNoteApiClient,
  ) {}

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
    return this.providerApi.setDefaultProvider({ providerId: providerId as any });
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

  listMessages(conversationId: string, params?: { page?: number; pageSize?: number }) {
    return this.messageApi.getMessages(conversationId, params);
  }

  createKnowledgeNote(request: CreateKnowledgeNoteReq) {
    return this.knowledgeNoteApi.createKnowledgeNote(request);
  }
}
