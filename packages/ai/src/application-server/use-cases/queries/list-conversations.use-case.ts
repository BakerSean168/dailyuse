/**
 * List Conversations Use Case
 *
 * 获取对话列表应用服务
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import type { ConversationListRes } from '@dailyuse/contracts/ai';

/**
 * List Conversations Use Case
 */
export class ListConversationsUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(cx: ExecutionContext, limit = 20, offset = 0): Promise<Result<ConversationListRes>> {
    const conversations = await this.conversationRepository.findRecent(cx.identityId, limit, offset);

    const page = Math.floor(offset / limit) + 1;

    return ok({
      data: conversations.map((c) => c.toClientDTO()),
      total: conversations.length,
      page,
      pageSize: limit,
    });
  }
}
