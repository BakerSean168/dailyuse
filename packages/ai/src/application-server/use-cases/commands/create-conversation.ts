import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import { AIConversation } from '../../../domain-server/aggregates/ai-conversation';
import type { CreateConversationReq, CreateConversationRes } from '@dailyuse/contracts/ai';
import { eventBus } from '@dailyuse/utils';

/**
 * Create Conversation Service
 */
export class CreateConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(identityId: string, input: CreateConversationReq): Promise<CreateConversationRes> {
    const conversation = AIConversation.create({
      identityId,
      name: input.name || 'New Conversation',
    });

    await this.conversationRepository.save(conversation);

    // Publish event
    // await eventBus.publish(new ConversationCreatedEvent(conversation));

    return conversation.toClientDTO();
  }
}
