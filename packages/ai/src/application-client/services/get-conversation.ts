/**
 * Get Conversation
 *
 * 获取 AI 对话详情用例
 */

import type { IAIConversationApiClient } from '@/infrastructure-client';
import { AIConversation } from '@/domain-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Get Conversation
 */
export class GetConversation {
  private static instance: GetConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): GetConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    GetConversation.instance = new GetConversation(client);
    return GetConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetConversation {
    if (!GetConversation.instance) {
      GetConversation.instance = GetConversation.createInstance();
    }
    return GetConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetConversation.instance = undefined as unknown as GetConversation;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<AIConversation> {
    const data = await this.apiClient.getConversationById(uuid);
    return AIConversation.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const getConversation = (uuid: string): Promise<AIConversation> =>
  GetConversation.getInstance().execute(uuid);
