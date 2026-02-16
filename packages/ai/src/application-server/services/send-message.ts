/**
 * Send Message Service
 *
 * 发送消息应用服�?
 */

import type { IAIConversationRepository } from '../../domain-server/repositories/IAIConversationRepository';
import { Message } from '../../domain-server/entities/message';
import type { SendMessageRequest, MessageResponse } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import { eventBus } from '@dailyuse/utils';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Send Message Service
 */
export class SendMessage {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(identityId: string, input: SendMessageRequest): Promise<MessageResponse> {
    // 1. 获取对话
    const conversation = await this.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.identityId !== identityId) {
      throw new Error('Not authorized');
    }

    // 2. 创建消息实体
    const message = Message.create({
      conversationId: input.conversationId,
      role: MessageRole.USER,
      content: input.content,
    });

    // 3. 添加消息到对�?
    conversation.addMessage(message);

    // 4. 保存
    await this.conversationRepository.save(conversation);

    // 5. 发布事件
    const events = conversation.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }

    return {
      message: message.toClientDTO(),
    };
  }
}
