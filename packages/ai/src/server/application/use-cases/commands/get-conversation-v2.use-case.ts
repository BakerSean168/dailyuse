import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import { AIConversation as AIConversationServer } from '../../../domain/aggregates/ai-conversation';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('GetConversationV2UseCase');

/**
 * 获取对话详情（包含消息）
 */
export class GetConversationV2UseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    conversationId: string,
    includeMessages: boolean = true,
  ): Promise<Result<AIConversationServer | null>> {
    try {
      const conversation = await this.conversationRepository.findById(conversationId, {
        includeChildren: includeMessages,
      });
      if (!conversation) {
        return ok(null);
      }

      logger.info('Conversation retrieved', { id: conversationId });

      return ok(conversation);
    } catch (err) {
      logger.error('Failed to get conversation', { error: err, conversationId });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to get conversation');
    }
  }
}
