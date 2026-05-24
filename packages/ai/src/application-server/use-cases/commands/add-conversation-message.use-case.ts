import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIConversationRepository } from '../../../domain-server/repositories/i-ai-conversation-repository';
import { Message as MessageServer } from '../../../domain-server/entities/message';
import type { MessageClientDTO } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AddConversationMessageUseCase');

/**
 * 添加消息到对话
 */
export class AddConversationMessageUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    conversationId: string,
    role: MessageRole,
    content: string,
    tokenCount?: number,
  ): Promise<Result<MessageClientDTO>> {
    try {
      const conversation = await this.conversationRepository.findById(conversationId, {
        includeChildren: true,
      });
      if (!conversation) {
        return error('NOT_FOUND', 'Conversation not found');
      }

      const message = MessageServer.create({
        conversationId,
        role,
        content,
        tokenCount,
      });

      conversation.addMessage(message);

      await this.conversationRepository.save(conversation);

      logger.info('Message added to conversation', {
        conversationId,
        messageId: message.id,
        role,
      });

      return ok(message.toClientDTO());
    } catch (err) {
      logger.error('Failed to add message', { error: err, conversationId, role });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to add message');
    }
  }
}
