/**
 * AI Container (Server)
 *
 * 依赖注入容器，管�?AI 模块�?repository 实例
 */

import type { 
  IAIConversationRepository,
  IAIGenerationTaskRepository,
  IAIUsageQuotaRepository,
  IAIProviderConfigRepository,
} from '@dailyuse/domain-server/ai';

/**
 * AI 模块依赖注入容器
 */
export class AIContainer {
  private static instance: AIContainer;
  private conversationRepository: IAIConversationRepository | null = null;
  private generationTaskRepository: IAIGenerationTaskRepository | null = null;
  private usageQuotaRepository: IAIUsageQuotaRepository | null = null;
  private providerConfigRepository: IAIProviderConfigRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    AIContainer.instance = new AIContainer();
  }

  // ============ Conversation Repository ============

  registerConversationRepository(repository: IAIConversationRepository): this {
    this.conversationRepository = repository;
    return this;
  }

  getConversationRepository(): IAIConversationRepository {
    if (!this.conversationRepository) {
      throw new Error('ConversationRepository not registered');
    }
    return this.conversationRepository;
  }

  // ============ Generation Task Repository ============

  registerGenerationTaskRepository(repository: IAIGenerationTaskRepository): this {
    this.generationTaskRepository = repository;
    return this;
  }

  getGenerationTaskRepository(): IAIGenerationTaskRepository {
    if (!this.generationTaskRepository) {
      throw new Error('GenerationTaskRepository not registered');
    }
    return this.generationTaskRepository;
  }

  // ============ Usage Quota Repository ============

  registerUsageQuotaRepository(repository: IAIUsageQuotaRepository): this {
    this.usageQuotaRepository = repository;
    return this;
  }

  getUsageQuotaRepository(): IAIUsageQuotaRepository {
    if (!this.usageQuotaRepository) {
      throw new Error('UsageQuotaRepository not registered');
    }
    return this.usageQuotaRepository;
  }

  // ============ Provider Config Repository ============

  registerProviderConfigRepository(repository: IAIProviderConfigRepository): this {
    this.providerConfigRepository = repository;
    return this;
  }

  getProviderConfigRepository(): IAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      throw new Error('ProviderConfigRepository not registered');
    }
    return this.providerConfigRepository;
  }

  // ============ Utilities ============

  isConfigured(): boolean {
    return (
      this.conversationRepository !== null &&
      this.generationTaskRepository !== null &&
      this.usageQuotaRepository !== null &&
      this.providerConfigRepository !== null
    );
  }

  clear(): void {
    this.conversationRepository = null;
    this.generationTaskRepository = null;
    this.usageQuotaRepository = null;
    this.providerConfigRepository = null;
  }
}
