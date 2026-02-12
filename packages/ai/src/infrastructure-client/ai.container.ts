/**
 * AI Container
 *
 * AI 模块的依赖容器，管理:
 * - Conversation API Client (HTTP/IPC)
 * - Message API Client (HTTP/IPC)
 * - Generation Task API Client (HTTP/IPC)
 * - Usage Quota API Client (HTTP/IPC)
 * - Provider Config API Client (HTTP/IPC)
 *
 * @example
 * ```ts
 * // 注册依赖
 * AIContainer.getInstance()
 *   .registerConversationApiClient(new AIConversationHttpAdapter(httpClient))
 *   .registerMessageApiClient(new AIMessageHttpAdapter(httpClient))
 *   .registerGenerationTaskApiClient(new AIGenerationTaskHttpAdapter(httpClient))
 *   .registerUsageQuotaApiClient(new AIUsageQuotaHttpAdapter(httpClient))
 *   .registerProviderConfigApiClient(new AIProviderConfigHttpAdapter(httpClient));
 *
 * // 获取依赖
 * const conversationApi = AIContainer.getInstance().getConversationApiClient();
 * ```
 */

import { ModuleContainerBase } from '../shared/di';
import type {
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGenerationTaskApiClient,
  IAIUsageQuotaApiClient,
  IAIProviderConfigApiClient,
} from './adapters/types';

/**
 * AI 模块依赖键
 */
const KEYS = {
  CONVERSATION_API_CLIENT: Symbol('AIConversationApiClient'),
  MESSAGE_API_CLIENT: Symbol('AIMessageApiClient'),
  GENERATION_TASK_API_CLIENT: Symbol('AIGenerationTaskApiClient'),
  USAGE_QUOTA_API_CLIENT: Symbol('AIUsageQuotaApiClient'),
  PROVIDER_CONFIG_API_CLIENT: Symbol('AIProviderConfigApiClient'),
} as const;

/**
 * AI 模块依赖容器
 */
export class AIContainer extends ModuleContainerBase {
  private static instance: AIContainer;

  private constructor() {
    super();
  }

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
    AIContainer.instance = undefined as unknown as AIContainer;
  }

  // ============ Conversation API Client ============

  /**
   * 注册 AI Conversation API Client
   */
  registerConversationApiClient(client: IAIConversationApiClient): this {
    this.container.register(KEYS.CONVERSATION_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 AI Conversation API Client
   */
  getConversationApiClient(): IAIConversationApiClient {
    return this.container.resolve<IAIConversationApiClient>(KEYS.CONVERSATION_API_CLIENT);
  }

  /**
   * 检查 Conversation API Client 是否已注册
   */
  hasConversationApiClient(): boolean {
    return this.container.has(KEYS.CONVERSATION_API_CLIENT);
  }

  // ============ Message API Client ============

  /**
   * 注册 AI Message API Client
   */
  registerMessageApiClient(client: IAIMessageApiClient): this {
    this.container.register(KEYS.MESSAGE_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 AI Message API Client
   */
  getMessageApiClient(): IAIMessageApiClient {
    return this.container.resolve<IAIMessageApiClient>(KEYS.MESSAGE_API_CLIENT);
  }

  /**
   * 检查 Message API Client 是否已注册
   */
  hasMessageApiClient(): boolean {
    return this.container.has(KEYS.MESSAGE_API_CLIENT);
  }

  // ============ Generation Task API Client ============

  /**
   * 注册 AI Generation Task API Client
   */
  registerGenerationTaskApiClient(client: IAIGenerationTaskApiClient): this {
    this.container.register(KEYS.GENERATION_TASK_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 AI Generation Task API Client
   */
  getGenerationTaskApiClient(): IAIGenerationTaskApiClient {
    return this.container.resolve<IAIGenerationTaskApiClient>(KEYS.GENERATION_TASK_API_CLIENT);
  }

  /**
   * 检查 Generation Task API Client 是否已注册
   */
  hasGenerationTaskApiClient(): boolean {
    return this.container.has(KEYS.GENERATION_TASK_API_CLIENT);
  }

  // ============ Usage Quota API Client ============

  /**
   * 注册 AI Usage Quota API Client
   */
  registerUsageQuotaApiClient(client: IAIUsageQuotaApiClient): this {
    this.container.register(KEYS.USAGE_QUOTA_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 AI Usage Quota API Client
   */
  getUsageQuotaApiClient(): IAIUsageQuotaApiClient {
    return this.container.resolve<IAIUsageQuotaApiClient>(KEYS.USAGE_QUOTA_API_CLIENT);
  }

  /**
   * 检查 Usage Quota API Client 是否已注册
   */
  hasUsageQuotaApiClient(): boolean {
    return this.container.has(KEYS.USAGE_QUOTA_API_CLIENT);
  }

  // ============ Provider Config API Client ============

  /**
   * 注册 AI Provider Config API Client
   */
  registerProviderConfigApiClient(client: IAIProviderConfigApiClient): this {
    this.container.register(KEYS.PROVIDER_CONFIG_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 AI Provider Config API Client
   */
  getProviderConfigApiClient(): IAIProviderConfigApiClient {
    return this.container.resolve<IAIProviderConfigApiClient>(KEYS.PROVIDER_CONFIG_API_CLIENT);
  }

  /**
   * 检查 Provider Config API Client 是否已注册
   */
  hasProviderConfigApiClient(): boolean {
    return this.container.has(KEYS.PROVIDER_CONFIG_API_CLIENT);
  }

  // ============ 通用方法 ============

  /**
   * 检查容器是否已配置（所有必要的依赖都已注册）
   */
  isConfigured(): boolean {
    return (
      this.hasConversationApiClient() &&
      this.hasMessageApiClient() &&
      this.hasGenerationTaskApiClient() &&
      this.hasUsageQuotaApiClient() &&
      this.hasProviderConfigApiClient()
    );
  }

  /**
   * 清空所有已注册的依赖
   */
  clear(): void {
    this.container.unregister(KEYS.CONVERSATION_API_CLIENT);
    this.container.unregister(KEYS.MESSAGE_API_CLIENT);
    this.container.unregister(KEYS.GENERATION_TASK_API_CLIENT);
    this.container.unregister(KEYS.USAGE_QUOTA_API_CLIENT);
    this.container.unregister(KEYS.PROVIDER_CONFIG_API_CLIENT);
  }
}

export { KEYS as AIDependencyKeys };
