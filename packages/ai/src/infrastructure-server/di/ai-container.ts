/**
 * AIContainer — legacy singleton DI container.
 * AIContainer —— 遗留单例依赖注入容器。
 *
 * Manages Repository bindings for the AI module:
 * 管理 AI 模块的仓储绑定：
 * - Runtime registration of Repository implementations
 *   运行时注册 Repository 实现
 * - Runtime resolution with null-safety checks
 *   运行时获取（带空值校验，确保已注册）
 * - reset() for test scenarios with mock implementations
 *   支持 reset() 用于测试场景替换 Mock 实现
 *
 * @deprecated The AI module no longer uses this container internally.
 *             It is kept only for backward compatibility with older callers.
 * @deprecated AI 模块内部已不再使用该容器；当前仅为兼容旧调用方保留。
 *
 * @see {@link createAIModule} Use the composition root factory for dependency injection.
 * @see {@link createAIModule} 使用组合根工厂进行依赖注入。
 */

import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';

export class AIContainer {
  private static instance: AIContainer;
  private conversationRepository?: IAIConversationRepository;
  private providerConfigRepository?: IAIProviderConfigRepository;

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  /** 注册 Conversation Repository 实现 */
  setConversationRepository(repository: IAIConversationRepository): void {
    this.conversationRepository = repository;
  }

  /** 注册 ProviderConfig Repository 实现 */
  setProviderConfigRepository(repository: IAIProviderConfigRepository): void {
    this.providerConfigRepository = repository;
  }

  /** 获取 Conversation Repository（未注册时抛出错误） */
  getConversationRepository(): IAIConversationRepository {
    if (!this.conversationRepository) {
      throw new Error('AIConversationRepository not registered in AIContainer');
    }
    return this.conversationRepository;
  }

  /** 获取 ProviderConfig Repository（未注册时抛出错误） */
  getProviderConfigRepository(): IAIProviderConfigRepository {
    if (!this.providerConfigRepository) {
      throw new Error('AIProviderConfigRepository not registered in AIContainer');
    }
    return this.providerConfigRepository;
  }

  /** 重置全部绑定（用于测试或重新初始化） */
  reset(): void {
    this.conversationRepository = undefined;
    this.providerConfigRepository = undefined;
  }
}
