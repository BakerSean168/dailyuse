import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain-server/repositories/i-ai-conversation-repository';
import type { AIConversationClientDTO } from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GetConversationsByStatusUseCase');

/**
 * 获取对话历史（按状态过滤）
 */
export class GetConversationsByStatusUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    status: ConversationStatus,
    cx: ExecutionContext,
  ): Promise<Result<AIConversationClientDTO[]>> {
    try {
      const allConversations = await this.conversationRepository.findByIdentityId(cx.identityId);

      const filteredConversations = allConversations.filter((conv) => {
        const dto = conv.toServerDTO();
        return dto.status === status;
      });

      const conversations = filteredConversations.map((conversation) =>
        conversation.toClientDTO(),
      );

      logger.info('Conversations retrieved by status', {
        identityId: cx.identityId,
        status,
        count: conversations.length,
      });

      return ok(conversations);
    } catch (err) {
      logger.error('Failed to get conversations by status', { error: err, identityId: cx.identityId, status });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to get conversations by status');
    }
  }
}
