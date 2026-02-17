/**
 * Get Conversation Service
 *
 * 获取单个对话应用服务
 */

import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import type { GetConversationRes } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Get Conversation Service
 */
export class GetConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(id: string, identityId: string): Promise<GetConversationRes> {
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.identityId !== identityId) {
      throw new Error('Not authorized to access this conversation');
    }

    return conversation.toClientDTO();
  }
}
