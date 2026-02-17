import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import type { IAIGenerationTaskRepository } from '../../domain-server/repositories/IAIGenerationTaskRepository';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';
import type { IAIUsageQuotaRepository } from '../../domain-server/repositories/IAIUsageQuotaRepository';

export class AIContainer {
  private static instance: AIContainer;
  private conversationRepository?: IAIConversationRepository;
  private generationTaskRepository?: IAIGenerationTaskRepository;
  private providerConfigRepository?: IAIProviderConfigRepository;
  private usageQuotaRepository?: IAIUsageQuotaRepository;

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

  setGenerationTaskRepository(repository: IAIGenerationTaskRepository): void {
    this.generationTaskRepository = repository;
  }

  setProviderConfigRepository(repository: IAIProviderConfigRepository): void {
    this.providerConfigRepository = repository;
  }

  setUsageQuotaRepository(repository: IAIUsageQuotaRepository): void {
    this.usageQuotaRepository = repository;
  }

  getConversationRepository(): IAIConversationRepository {
    if (!this.conversationRepository) {
      throw new Error('AIConversationRepository not registered in AIContainer');
    }
    return this.conversationRepository;
  }

  getGenerationTaskRepository(): IAIGenerationTaskRepository {
    if (!this.generationTaskRepository) {
      throw new Error('AIGenerationTaskRepository not registered in AIContainer');
    }
    return this.generationTaskRepository;
  }

  getProviderConfigRepository(): IAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      throw new Error('AIProviderConfigRepository not registered in AIContainer');
    }
    return this.providerConfigRepository;
  }

  getUsageQuotaRepository(): IAIUsageQuotaRepository {
    if (!this.usageQuotaRepository) {
      throw new Error('AIUsageQuotaRepository not registered in AIContainer');
    }
    return this.usageQuotaRepository;
  }

  reset(): void {
    this.conversationRepository = undefined;
    this.generationTaskRepository = undefined;
    this.providerConfigRepository = undefined;
    this.usageQuotaRepository = undefined;
  }
}
