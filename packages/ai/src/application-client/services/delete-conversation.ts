/**
 * Delete Conversation
 *
 * 删除 AI 对话用例
 */

import type { IAIConversationApiClient } from '../../infrastructure-client/adapters/types';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Delete Conversation
 */
export class DeleteConversation {
  private static instance: DeleteConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): DeleteConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    DeleteConversation.instance = new DeleteConversation(client);
    return DeleteConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteConversation {
    if (!DeleteConversation.instance) {
      DeleteConversation.instance = DeleteConversation.createInstance();
    }
    return DeleteConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteConversation.instance = undefined as unknown as DeleteConversation;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteConversation(uuid);
  }
}

/**
 * 便捷函数
 */
export const deleteConversation = (uuid: string): Promise<void> =>
  DeleteConversation.getInstance().execute(uuid);
