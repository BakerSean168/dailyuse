/**
 * AI Chat Application Service
 *
 * AI 聊天应用服务 - 管理对话、消息处理、流式响?
 * 依赖注入模式：所有依赖通过构造函数注入，不直接依赖具体实?
 */

import type { IAIConversationRepository } from '../../../domain-server/repositories/IAIConversationRepository';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import { AIConversation as AIConversationServer } from '../../../domain-server/aggregates/ai-conversation';
import { Message as MessageServer } from '../../../domain-server/entities/message';
import type { MessageClientDTO, SendMessageRes } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('AIChatApplicationService');

/**
 * AI Chat Application Service
 */
export class AIChatApplicationService {
  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
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
    const conversation = await this.validateAndGetConversation(identityId, conversationId);
    const userMessage = await this.saveMessage(conversation, MessageRole.User, content);
    const history = await this.getConversationHistory(conversationId);
    const prompt = this.formatChatPrompt(history, content);
    const aiResponseContent = await this.generateChatResponse(identityId, prompt);
    const assistantMessage = await this.saveMessage(
      conversation,
      MessageRole.Assistant,
      aiResponseContent,
    );

    const providerConfig = await this.getProviderConfig(identityId);

    return {
      userMessage,
      assistantMessage,
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      providerId: providerConfig.id,
      processingTimeMs: 0,
    };
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

    let fullContent = '';

    try {
      fullContent = await this.generateChatResponse(identityId, prompt);
      onChunk({
        content: fullContent,
        role: MessageRole.Assistant,
      });

      await this.saveMessage(conversation, MessageRole.Assistant, fullContent);
    } catch (error) {
      logger.error('AI Stream Failed', error);
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

  private async generateChatResponse(identityId: string, prompt: string): Promise<string> {
    const providerConfig = await this.getProviderConfig(identityId);
    const response = await this.requestChatCompletion(providerConfig, prompt);
    return response.content;
  }

  private async getProviderConfig(identityId: string) {
    const defaultConfig = await this.providerConfigRepository.findDefaultByIdentityId(identityId);
    if (defaultConfig && defaultConfig.isActive) {
      return defaultConfig;
    }

    const providers = await this.providerConfigRepository.findByIdentityId(identityId);
    const activeProvider = providers.find((provider) => provider.isActive);
    if (!activeProvider) {
      throw new Error('No AI provider configured');
    }

    return activeProvider;
  }

  private async requestChatCompletion(
    config: { baseUrl: string; apiKey: string; defaultModel: string | null; name?: string },
    prompt: string,
  ): Promise<{ content: string }> {
    const url = new URL('/v1/chat/completions', config.baseUrl);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.defaultModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Provider error: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('AI Provider returned empty response');
    }

    return { content };
  }
}
