/**
 * Close Conversation
 *
 * 关闭 AI 对话用例
 */

import type { IAIConversationApiClient } from '@/infrastructure-client';
import { AIConversation } from '@/domain-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Close Conversation
 */
export class CloseConversation {
  private static instance: CloseConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): CloseConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    CloseConversation.instance = new CloseConversation(client);
    return CloseConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CloseConversation {
    if (!CloseConversation.instance) {
      CloseConversation.instance = CloseConversation.createInstance();
    }
    return CloseConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CloseConversation.instance = undefined as unknown as CloseConversation;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<AIConversation> {
    const data = await this.apiClient.closeConversation(uuid);
    return AIConversation.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const closeConversation = (uuid: string): Promise<AIConversation> =>
  CloseConversation.getInstance().execute(uuid);
