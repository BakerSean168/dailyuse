/**
 * AI Chat Application Service
 *
 * AI 聊天应用服务 - 管理对话、消息处理、流式响�?
 * 依赖注入模式：所有依赖通过构造函数注入，不直接依赖具体实�?
 */

import type {
  IAIConversationRepository,
} from '../../domain-server/repositories/IAIConversationRepository';
import type {
  IAIAdapter,
  AIGenerationRequest,
  AIStreamChunk,
} from '../../domain-server/interfaces/adapter-types';
import { AIConversation as AIConversationServer } from '../../domain-server/aggregates/ai-conversation';
import { Message as MessageServer } from '../../domain-server/entities/message';
import type { MessageClientDTO, SendMessageRes } from '@dailyuse/contracts/ai';
import { MessageRole, GenerationTaskType } from '@dailyuse/contracts/ai';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('AIChatApplicationService');

/**
 * AI Chat Application Service
 */
export class AIChatApplicationService {
  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly aiAdapter: IAIAdapter,
  ) {}

  /**
   * Send a message and get a complete response
   */
  async sendMessage(
    identityId: string,
    conversationId: string,
    content: string,
    provider?: string,
    model?: string,
  ): Promise<SendMessageRes> {
    // 1. Validate & Save User Message
    const conversation = await this.validateAndGetConversation(identityId, conversationId);
    const userMessage = await this.saveMessage(conversation, MessageRole.User, content);

    // 2. Prepare Context (History)
    // For simplicity, we just use the current message as prompt or fetch recent history
    // Ideally we should format history into a prompt string or use a chat-capable adapter
    const history = await this.getConversationHistory(conversationId);
    const prompt = this.formatChatPrompt(history, content);

    // 3. Call AI
    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GeneralChat,
      prompt: prompt,
      systemPrompt: 'You are a helpful assistant.',
      // provider/model handling would go here if adapter supports dynamic config or we swtich adapter
    };

    let aiResponseContent = '';
    try {
      const response = await this.aiAdapter.generateText(request);
      aiResponseContent = response.content;
    } catch (error) {
      logger.error('AI Generation Failed', error);
      throw new Error('AI Service Unavailable');
    }

    // 4. Save AI Message
    const aiMessage = await this.saveMessage(
      conversation,
      MessageRole.Assistant,
      aiResponseContent,
    );

    return aiMessage;
  }

  /**
   * Send a message and stream the response
   */
  async sendMessageStream(
    identityId: string,
    conversationId: string,
    content: string,
    onChunk: (chunk: any) => void,
    provider?: string,
    model?: string,
  ): Promise<void> {
    const conversation = await this.validateAndGetConversation(identityId, conversationId);
    await this.saveMessage(conversation, MessageRole.User, content);

    const history = await this.getConversationHistory(conversationId);
    const prompt = this.formatChatPrompt(history, content);

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.GeneralChat,
      prompt: prompt,
      systemPrompt: 'You are a helpful assistant.',
    };

    let fullContent = '';

    try {
      for await (const chunk of this.aiAdapter.streamText(request)) {
        fullContent = chunk.fullText;
        onChunk({
          content: chunk.delta,
          role: MessageRole.Assistant,
        }); // Stream delta to client
      }

      // Save full AI message after stream completes
      await this.saveMessage(conversation, MessageRole.Assistant, fullContent);
    } catch (error) {
      logger.error('AI Stream Failed', error);
      // Should probably notify client of error
      throw error;
    }
  }

  // --- Helper Methods ---

  private async validateAndGetConversation(
    identityId: string,
    conversationId: string,
  ): Promise<AIConversationServer> {
    const conversation = await this.conversationRepository.findById(conversationId, {
      includeChildren: true,
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (conversation.identityId !== identityId) {
      throw new Error('Not authorized');
    }
    return conversation;
  }

  private async saveMessage(
    conversation: AIConversationServer,
    role: MessageRole,
    content: string,
  ): Promise<MessageClientDTO> {
    const message = MessageServer.create({
      conversationId: conversation.id,
      role,
      content,
    });
    conversation.addMessage(message);
    await this.conversationRepository.save(conversation);

    // Emit events
    const events = conversation.pullDomainEvents();
    for (const event of events) {
      eventBus.send(event.eventType as any, event as any);
    }

    return message.toClientDTO();
  }

  private async getConversationHistory(conversationId: string): Promise<MessageClientDTO[]> {
    const conversation = await this.conversationRepository.findById(conversationId, {
      includeChildren: true,
    });
    if (!conversation) return [];
    // Assuming messages are loaded
    const messages = conversation.getAllMessages?.() || []; // Get all messages from aggregate
    // If messages are private/protected, we rely on Repository `includeChildren` to populate them.
    // Aggregate root should expose them or we fetch usage DTO.
    return messages.map((m: any) => m.toClientDTO?.() || m);
  }

  private formatChatPrompt(history: MessageClientDTO[], newContent: string): string {
    // Simple formatting.
    // Note: Ideally adapter handles structured messages.
    let prompt = '';
    for (const msg of history) {
      prompt += `${msg.role}: ${msg.content}\n`;
    }
    // prompt += `user: ${newContent}\n`; // newContent is already in history if we saved it first?
    // If we saved user message first, it is in history.
    return prompt;
  }
}
