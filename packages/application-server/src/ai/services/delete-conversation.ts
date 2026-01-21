/**
 * Delete Conversation Service
 *
 * 删除对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { eventBus } from '@dailyuse/utils';
// import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Conversation Service
 */
export class DeleteConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(uuid: string, accountUuid: string): Promise<void> {
    const conversation = await this.conversationRepository.findByUuid(uuid);
    
    if (!conversation) {
      return; // 已删除视为成功
    }

    if (conversation.accountUuid !== accountUuid) {
      throw new Error('Not authorized to delete this conversation');
    }

    await this.conversationRepository.delete(uuid);

    await eventBus.emit('AIConversationDeleted', {
      conversationUuid: uuid,
      accountUuid,
    });
  }
}
