/**
 * Create Conversation
 *
 * 创建 AI 对话用例
 */

import type { IAIConversationApiClient } from '../../infrastructure-client/adapters/types';
import type { CreateConversationRequest } from '@dailyuse/contracts/ai';
import { AIConversation } from '../../domain-client/aggregates/ai-conversation';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Create Conversation Input
 */
export type CreateConversationInput = CreateConversationRequest;

/**
 * Create Conversation
 */
export class CreateConversation {
  private static instance: CreateConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): CreateConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    CreateConversation.instance = new CreateConversation(client);
    return CreateConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateConversation {
    if (!CreateConversation.instance) {
      CreateConversation.instance = CreateConversation.createInstance();
    }
    return CreateConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateConversation.instance = undefined as unknown as CreateConversation;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateConversationInput): Promise<AIConversation> {
    const data = await this.apiClient.createConversation(input);
    return AIConversation.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const createConversation = (input: CreateConversationInput): Promise<AIConversation> =>
  CreateConversation.getInstance().execute(input);
