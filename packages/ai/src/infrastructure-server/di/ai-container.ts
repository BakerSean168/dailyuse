import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';

export class AIContainer {
  private static instance: AIContainer;
  private conversationRepository?: IAIConversationRepository;
  private providerConfigRepository?: IAIProviderConfigRepository;

  private constructor() {}

  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  setConversationRepository(repository: IAIConversationRepository): void {
    this.conversationRepository = repository;
  }

  setProviderConfigRepository(repository: IAIProviderConfigRepository): void {
    this.providerConfigRepository = repository;
  }

  getConversationRepository(): IAIConversationRepository {
    if (!this.conversationRepository) {
      throw new Error('AIConversationRepository not registered in AIContainer');
    }
    return this.conversationRepository;
  }

  getProviderConfigRepository(): IAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      throw new Error('AIProviderConfigRepository not registered in AIContainer');
    }
    return this.providerConfigRepository;
  }

  reset(): void {
    this.conversationRepository = undefined;
    this.providerConfigRepository = undefined;
  }
}
