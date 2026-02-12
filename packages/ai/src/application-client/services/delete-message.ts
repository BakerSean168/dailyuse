/**
 * Delete Message
 *
 * 删除 AI 消息用例
 */

import type { IAIMessageApiClient } from '../../infrastructure-client/adapters/types';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Delete Message
 */
export class DeleteMessage {
  private static instance: DeleteMessage;

  private constructor(private readonly apiClient: IAIMessageApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIMessageApiClient): DeleteMessage {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getMessageApiClient();
    DeleteMessage.instance = new DeleteMessage(client);
    return DeleteMessage.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteMessage {
    if (!DeleteMessage.instance) {
      DeleteMessage.instance = DeleteMessage.createInstance();
    }
    return DeleteMessage.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteMessage.instance = undefined as unknown as DeleteMessage;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteMessage(uuid);
  }
}

/**
 * 便捷函数
 */
export const deleteMessage = (uuid: string): Promise<void> =>
  DeleteMessage.getInstance().execute(uuid);
