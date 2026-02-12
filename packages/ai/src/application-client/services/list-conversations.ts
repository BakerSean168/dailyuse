/**
 * List Conversations
 *
 * 获取 AI 对话列表用例
 */

import type { IAIConversationApiClient } from '../../infrastructure-client/adapters/types';
import { AIConversation } from '../../domain-client/aggregates/ai-conversation';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * List Conversations
 */
export class ListConversations {
  private static instance: ListConversations;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): ListConversations {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    ListConversations.instance = new ListConversations(client);
    return ListConversations.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListConversations {
    if (!ListConversations.instance) {
      ListConversations.instance = ListConversations.createInstance();
    }
    return ListConversations.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListConversations.instance = undefined as unknown as ListConversations;
  }

  /**
   * 执行用例
   */
  async execute(params: { page?: number; pageSize?: number; status?: string } = {}): Promise<{ conversations: AIConversation[]; total: number }> {
    const response = await this.apiClient.getConversations(params);
    return {
      conversations: response.conversations.map((dto) => AIConversation.fromClientDTO(dto)),
      total: response.total,
    };
  }
}
