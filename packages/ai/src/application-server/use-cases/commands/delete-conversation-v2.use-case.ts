import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DeleteConversationV2UseCase');

/**
 * 删除对话（软删除）
 */
export class DeleteConversationV2UseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(conversationId: string): Promise<Result<void>> {
    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        return error('NOT_FOUND', 'Conversation not found');
      }

      conversation.softDelete();
      await this.conversationRepository.save(conversation);

      logger.info('Conversation deleted', { id: conversationId });
      return ok(undefined);
    } catch (err) {
      logger.error('Failed to delete conversation', { error: err, conversationId });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }
}
