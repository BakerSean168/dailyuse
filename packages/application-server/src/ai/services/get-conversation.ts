/**
 * Get Conversation Service
 *
 * 获取单个对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import type { ConversationResponse } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Conversation Service
 */
export class GetConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(uuid: string, accountUuid: string): Promise<ConversationResponse> {
    const conversation = await this.conversationRepository.findByUuid(uuid);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.accountUuid !== accountUuid) {
      throw new Error('Not authorized to access this conversation');
    }

    return {
      conversation: conversation.toClientDTO(),
    };
  }
}
