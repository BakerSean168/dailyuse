/**
 * Archive Conversation
 *
 * 归档 AI 对话用例
 */

import type { IAIConversationApiClient } from '@/infrastructure-client';
import { AIConversation } from '@/domain-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Archive Conversation
 */
export class ArchiveConversation {
  private static instance: ArchiveConversation;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): ArchiveConversation {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    ArchiveConversation.instance = new ArchiveConversation(client);
    return ArchiveConversation.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ArchiveConversation {
    if (!ArchiveConversation.instance) {
      ArchiveConversation.instance = ArchiveConversation.createInstance();
    }
    return ArchiveConversation.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ArchiveConversation.instance = undefined as unknown as ArchiveConversation;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<AIConversation> {
    const data = await this.apiClient.archiveConversation(uuid);
    return AIConversation.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const archiveConversation = (uuid: string): Promise<AIConversation> =>
  ArchiveConversation.getInstance().execute(uuid);
