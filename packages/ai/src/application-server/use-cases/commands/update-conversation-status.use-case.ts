import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('UpdateConversationStatusUseCase');

/**
 * 更新对话状态
 */
export class UpdateConversationStatusUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    conversationId: string,
    status: ConversationStatus,
  ): Promise<Result<void>> {
    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        return error('NOT_FOUND', 'Conversation not found');
      }

      conversation.updateStatus(status);

      await this.conversationRepository.save(conversation);

      logger.info('Conversation status updated', { id: conversationId, status });
      return ok(undefined);
    } catch (err) {
      logger.error('Failed to update conversation status', { error: err, conversationId, status });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to update conversation status');
    }
  }
}
