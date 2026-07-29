import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import type { ConversationListRes } from '@memoflow/contracts/ai';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('ListConversationsUseCase');

/**
 * 获取用户的所有对话（列表视图 - 不包含消息）
 */
export class ListConversationsUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    cx: ExecutionContext,
    page: number = 1,
    limit: number = 20,
  ): Promise<Result<ConversationListRes>> {
    try {
      const allConversations = await this.conversationRepository.findByIdentityId(cx.identityId);
      const total = allConversations.length;

      const offset = (page - 1) * limit;
      const paginatedConversations = allConversations.slice(offset, offset + limit);

      const conversations = paginatedConversations.map((conversation) =>
        conversation.toClientDTO(),
      );

      logger.info('Conversations listed', {
        identityId: cx.identityId,
        page,
        limit,
        count: conversations.length,
        total,
      });

      return ok({
        data: conversations,
        total,
        page,
        pageSize: limit,
      });
    } catch (err) {
      logger.error('Failed to list conversations', { error: err, identityId: cx.identityId, page, limit });
      return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to list conversations');
    }
  }
}
