/**
 * Update Conversation
 *
 * 更新 AI 对话用例
 */

import type { IAIConversationApiClient } from '../../infrastructure-client/adapters/types';
import type { UpdateConversationRequest } from '@dailyuse/contracts/ai';
import { AIConversation } from '../../domain-client/aggregates/ai-conversation';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Update Conversation
 */
export class UpdateConversation {
  private static instance: UpdateConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): UpdateConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    UpdateConversation.instance = new UpdateConversation(client);
    return UpdateConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateConversation {
    if (!UpdateConversation.instance) {
      UpdateConversation.instance = UpdateConversation.createInstance();
    }
    return UpdateConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateConversation.instance = undefined as unknown as UpdateConversation;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, request: UpdateConversationRequest): Promise<AIConversation> {
    const data = await this.apiClient.updateConversation(uuid, request);
    return AIConversation.fromClientDTO(data);
  }
}
