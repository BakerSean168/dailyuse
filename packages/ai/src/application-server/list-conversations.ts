/**
 * List Conversations Service
 *
 * 获取对话列表应用服务
 */

import type { IAIConversationRepository } from '@/domain-server';
import type { ConversationListResponse } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * List Conversations Service
 */
export class ListConversations {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(accountUuid: string, limit = 20, offset = 0): Promise<ConversationListResponse> {
    const conversations = await this.conversationRepository.findRecent(
      accountUuid,
      limit,
      offset,
    );

    return {
      conversations: conversations.map((c) => c.toClientDTO()),
      total: conversations.length,
    };
  }
}
