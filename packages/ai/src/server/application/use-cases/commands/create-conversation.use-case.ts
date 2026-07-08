import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import { AIConversation } from '../../../domain/aggregates/ai-conversation';
import type { CreateConversationReq, CreateConversationRes } from '@dailyuse/contracts/ai';

/**
 * Create Conversation Use Case
 */
export class CreateConversationUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(input: CreateConversationReq, cx: ExecutionContext): Promise<Result<CreateConversationRes>> {
    const conversation = AIConversation.create({
      identityId: cx.identityId,
      name: input.name || 'New Conversation',
    });

    await this.conversationRepository.save(conversation);

    return ok(conversation.toClientDTO());
  }
}
