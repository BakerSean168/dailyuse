/**
 * Send Message Service
 *
 * 发送消息应用服?
 */

import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import { Message } from '../../../domain-server/entities/message';
import type { SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';

/**
 * Send Message Service
 */
export class SendMessage {
  constructor(private readonly conversationRepository: IAIConversationRepository) {}

  async execute(identityId: string, input: SendMessageReq): Promise<SendMessageRes> {
    // 1. 获取对话
    const conversation = await this.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.identityId !== identityId) {
      throw new Error('Not authorized');
    }

    // 2. 创建消息实体
    const userMessage = Message.create({
      conversationId: input.conversationId,
      role: MessageRole.User,
      content: input.content,
    });

    conversation.addMessage(userMessage);

    const assistantMessage = Message.create({
      conversationId: input.conversationId,
      role: MessageRole.Assistant,
      content: 'AI response placeholder',
    });
    conversation.addMessage(assistantMessage);

    // 4. 保存
    await this.conversationRepository.save(conversation);

    return {
      userMessage: userMessage.toClientDTO(),
      assistantMessage: assistantMessage.toClientDTO(),
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      providerId: 'IAiProviderConfigId_placeholder' as any,
      processingTimeMs: 0,
    };
  }
}
