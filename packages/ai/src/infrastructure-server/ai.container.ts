/**
 * AI Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?AI 妯″潡�?repository 瀹炰�?
 */

import type { IAIConversationRepository } from '../domain-server/repositories/IAIConversationRepository';
import type { IAIGenerationTaskRepository } from '../domain-server/repositories/IAIGenerationTaskRepository';
import type { IAIUsageQuotaRepository } from '../domain-server/repositories/IAIUsageQuotaRepository';
import type { IAIProviderConfigRepository } from '../domain-server/repositories/IAIProviderConfigRepository';

/**
 * AI 妯″潡渚濊禆娉ㄥ叆瀹瑰�?
 */
export class AIContainer {
  private static instance: AIContainer;
  private conversationRepository: IAIConversationRepository | null = null;
  private generationTaskRepository: IAIGenerationTaskRepository | null = null;
  private usageQuotaRepository: IAIUsageQuotaRepository | null = null;
  private providerConfigRepository: IAIProviderConfigRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
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
