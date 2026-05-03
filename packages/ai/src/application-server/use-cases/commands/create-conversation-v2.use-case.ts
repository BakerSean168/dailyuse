import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import { AIConversation as AIConversationServer } from '../../../domain-server/aggregates/ai-conversation';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateConversationV2UseCase');

/**
 * 创建新对话
 */
export class CreateConversationV2UseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(cx: ExecutionContext, title?: string): Promise<Result<AIConversationClientDTO>> {
    try {
      const conversation = AIConversationServer.create({
        identityId: cx.identityId,
        name: title ?? 'New Chat',
      });

      await this.conversationRepository.save(conversation);

      logger.info('Conversation created', {
        id: conversation.id,
        identityId: cx.identityId,
        name: conversation.name,
      });

      return ok(conversation.toClientDTO());
    } catch (err) {
      logger.error('Failed to create conversation', { error: err, identityId: cx.identityId, title });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to create conversation');
    }
  }
}
