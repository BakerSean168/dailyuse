/**
 * AI Chat Application Service
 *
 * AI 聊天应用服务 - 管理对话、消息处理、流式响应
 * 依赖注入模式：所有依赖通过构造函数注入，不直接依赖具体实现
 */

import type {
  IAIConversationRepository,
  IAIAdapter,
  AIGenerationRequest,
  AIStreamChunk,
} from '@dailyuse/domain-server/ai';
import { AIConversationServer, MessageServer } from '@dailyuse/domain-server/ai';
import type { MessageClientDTO, MessageResponse } from '@dailyuse/contracts/ai';
import { MessageRole, GenerationTaskType } from '@dailyuse/contracts/ai';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('AIChatApplicationService');

/**
 * AI Chat Application Service
 */
export class AIChatApplicationService {
  private static instance: AIChatApplicationService | undefined;

  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly aiAdapter: IAIAdapter,
  ) {}

  /**
   * 获取服务单例
   */
  static getInstance(): AIChatApplicationService {
    if (!AIChatApplicationService.instance) {
      throw new Error('AIChatApplicationService not initialized. Call setInstance() first.');
    }
    return AIChatApplicationService.instance;
  }

  /**
   * 设置服务单例
   */
  static setInstance(instance: AIChatApplicationService): void {
    AIChatApplicationService.instance = instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    AIChatApplicationService.instance = undefined;
  }

  /**
   * Send a message and get a complete response
   */
  async sendMessage(
    accountUuid: string,
    conversationUuid: string,
    content: string,
    provider?: string,
    model?: string,
  ): Promise<MessageResponse> {
    // 1. Validate & Save User Message
    const conversation = await this.validateAndGetConversation(accountUuid, conversationUuid);
    const userMessage = await this.saveMessage(conversation, MessageRole.USER, content);

    // 2. Prepare Context (History)
    // For simplicity, we just use the current message as prompt or fetch recent history
    // Ideally we should format history into a prompt string or use a chat-capable adapter
    const history = await this.getConversationHistory(conversationUuid);
    const prompt = this.formatChatPrompt(history, content);

    // 3. Call AI
    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.CHAT, // Assuming CHAT task type exists or we reuse generic
      prompt: prompt,
      systemPrompt: conversation.context || 'You are a helpful assistant.',
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
      MessageRole.ASSISTANT,
      aiResponseContent,
    );

    return {
      message: aiMessage, // Return AI message (or User message? Chat UI usually wants AI reply)
    };
  }

  /**
   * Send a message and stream the response
   */
  async sendMessageStream(
    accountUuid: string,
    conversationUuid: string,
    content: string,
    onChunk: (chunk: any) => void,
    provider?: string,
    model?: string,
  ): Promise<void> {
    const conversation = await this.validateAndGetConversation(accountUuid, conversationUuid);
    await this.saveMessage(conversation, MessageRole.USER, content);

    const history = await this.getConversationHistory(conversationUuid);
    const prompt = this.formatChatPrompt(history, content);

    const request: AIGenerationRequest = {
      taskType: GenerationTaskType.CHAT,
      prompt: prompt,
      systemPrompt: conversation.context || 'You are a helpful assistant.',
    };

    let fullContent = '';

    try {
      for await (const chunk of this.aiAdapter.streamText(request)) {
        fullContent = chunk.fullText;
        onChunk({
          content: chunk.delta,
          role: MessageRole.ASSISTANT,
        }); // Stream delta to client
      }

      // Save full AI message after stream completes
      await this.saveMessage(conversation, MessageRole.ASSISTANT, fullContent);
    } catch (error) {
      logger.error('AI Stream Failed', error);
      // Should probably notify client of error
      throw error;
    }
  }

  // --- Helper Methods ---

  private async validateAndGetConversation(
    accountUuid: string,
    conversationUuid: string,
  ): Promise<AIConversationServer> {
    const conversation = await this.conversationRepository.findByUuid(conversationUuid, {
      includeChildren: true,
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (conversation.accountUuid !== accountUuid) {
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
      conversationUuid: conversation.uuid,
      role,
      content,
    });
    conversation.addMessage(message);
    await this.conversationRepository.save(conversation);

    // Emit events
    const events = conversation.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
    conversation.clearDomainEvents();

    return message.toClientDTO();
  }

  private async getConversationHistory(conversationUuid: string): Promise<MessageClientDTO[]> {
    const conversation = await this.conversationRepository.findByUuid(conversationUuid, {
      includeChildren: true,
    });
    if (!conversation) return [];
    // Assuming messages are loaded
    const messages = conversation.getMessages(); // Method on Aggregate or need to acccess propert?
    // If messages are private/protected, we rely on Repository `includeChildren` to populate them.
    // Aggregate root should expose them or we fetch usage DTO.
    return messages.map((m) => m.toClientDTO());
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

/**
 * 便捷函数：发送消息
 */
export const sendMessage = (
  accountUuid: string,
  conversationUuid: string,
  content: string,
  provider?: string,
  model?: string,
): ReturnType<AIChatApplicationService['sendMessage']> =>
  AIChatApplicationService.getInstance().sendMessage(
    accountUuid,
    conversationUuid,
    content,
    provider,
    model,
  );

/**
 * 便捷函数：流式发送消息
 */
export const sendMessageStream = (
  accountUuid: string,
  conversationUuid: string,
  content: string,
  onChunk: (chunk: any) => void,
  provider?: string,
  model?: string,
): ReturnType<AIChatApplicationService['sendMessageStream']> =>
  AIChatApplicationService.getInstance().sendMessageStream(
    accountUuid,
    conversationUuid,
    content,
    onChunk,
    provider,
    model,
  );
