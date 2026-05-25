/**
 * Get Conversation Use Case
 *
 * 获取单个对话应用服务
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain-server/repositories/i-ai-conversation-repository';
import type { GetConversationRes } from '@dailyuse/contracts/ai';

/**
 * Get Conversation Use Case
 */
export class GetConversationUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(id: string, cx: ExecutionContext): Promise<Result<GetConversationRes>> {
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      return error('NOT_FOUND', 'Conversation not found');
    }

    if (conversation.identityId !== cx.identityId) {
      return error('FORBIDDEN', 'Not authorized to access this conversation');
    }

    return ok(conversation.toClientDTO());
  }
}
