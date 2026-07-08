import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import type { AIConversationClientDTO, UpdateConversationReq } from '@dailyuse/contracts/ai';

export class UpdateConversationUseCase {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    conversationId: string,
    request: UpdateConversationReq,
  ): Promise<Result<AIConversationClientDTO>> {
    const conversation = await this.conversationRepository.findById(conversationId, {
      includeChildren: false,
    });
    if (!conversation) {
      return error('NOT_FOUND', 'Conversation not found');
    }

    conversation.rename(request.name);
    await this.conversationRepository.save(conversation);
    return ok(conversation.toClientDTO());
  }
}
