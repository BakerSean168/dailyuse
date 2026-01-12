/**
 * List Messages
 *
 * 获取 AI 消息列表用例
 */

import type { IAIMessageApiClient } from '@dailyuse/infrastructure-client';
import { AIMessage } from '@dailyuse/domain-client/ai';
import { AIContainer } from '@dailyuse/infrastructure-client';

/**
 * List Messages
 */
export class ListMessages {
  private static instance: ListMessages;

  private constructor(private readonly apiClient: IAIMessageApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIMessageApiClient): ListMessages {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getMessageApiClient();
    ListMessages.instance = new ListMessages(client);
    return ListMessages.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListMessages {
    if (!ListMessages.instance) {
      ListMessages.instance = ListMessages.createInstance();
    }
    return ListMessages.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListMessages.instance = undefined as unknown as ListMessages;
  }

  /**
   * 执行用例
   */
  async execute(conversationUuid: string, params: { page?: number; pageSize?: number } = {}): Promise<{ messages: AIMessage[]; total: number }> {
    const response = await this.apiClient.getMessages(conversationUuid, params);
    return {
      messages: response.messages.map((dto) => AIMessage.fromClientDTO(dto)),
      total: response.total,
    };
  }
}
