/**
 * List Conversations Service
 *
 * 获取对话列表应用服务
 */

import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import type { ConversationListRes } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * List Conversations Service
 */
export class ListConversations {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(identityId: string, limit = 20, offset = 0): Promise<ConversationListRes> {
    const conversations = await this.conversationRepository.findRecent(identityId, limit, offset);

    const page = Math.floor(offset / limit) + 1;

    return {
      data: conversations.map((c) => c.toClientDTO()),
      total: conversations.length,
      page,
      pageSize: limit,
    };
  }
}
