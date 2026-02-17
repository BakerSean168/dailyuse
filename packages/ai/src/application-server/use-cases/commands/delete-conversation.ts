/**
 * Delete Conversation Service
 *
 * 删除对话应用服务
 */

import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import { eventBus } from '@dailyuse/utils';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Delete Conversation Service
 */
export class DeleteConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(id: string, identityId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(id);
    
    if (!conversation) {
      return; // 已删除视为成�?
    }

    if (conversation.identityId !== identityId) {
      throw new Error('Not authorized to delete this conversation');
    }

    await this.conversationRepository.delete(id);

    eventBus.send('AIConversationDeleted' as any, {
      conversationId: id,
      identityId,
    });
  }
}
