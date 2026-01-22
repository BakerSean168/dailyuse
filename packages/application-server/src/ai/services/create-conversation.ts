/**
 * Create Conversation Service
 *
 * 创建 AI 对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { AIConversation } from '@dailyuse/domain-server/ai';
import type { CreateConversationRequest, ConversationResponse } from '@dailyuse/contracts/ai';
import { eventBus } from '@dailyuse/utils';
// import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Conversation Service
 */
export class CreateConversation {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(
    accountUuid: string,
    input: CreateConversationRequest,
  ): Promise<ConversationResponse> {
    const conversation = AIConversation.create({
      accountUuid,
      title: input.title || 'New Conversation',
    });

    await this.conversationRepository.save(conversation);

    // Publish event
    // await eventBus.publish(new ConversationCreatedEvent(conversation));

    return {
      conversation: conversation.toClientDTO(),
    };
  }
}
