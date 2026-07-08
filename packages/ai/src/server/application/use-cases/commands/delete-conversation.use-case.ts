/**
 * Delete Conversation Use Case
 *
 * 删除对话应用服务
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';

/**
 * Delete Conversation Use Case
 */
export class DeleteConversationUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(id: string, cx: ExecutionContext): Promise<Result<void>> {
    const conversation = await this.conversationRepository.findById(id);

    if (!conversation) {
      return ok(undefined); // Already deleted is treated as success
    }

    if (conversation.identityId !== cx.identityId) {
      return error('FORBIDDEN', 'Not authorized to delete this conversation');
    }

    conversation.softDelete();
    await this.conversationRepository.save(conversation);

    return ok(undefined);
  }
}
