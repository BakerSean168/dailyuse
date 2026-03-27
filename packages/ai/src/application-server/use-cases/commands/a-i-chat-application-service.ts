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
import type {
  ChatExecutionMessage,
  ChatExecutionUsage,
  IAIExecutionLogPort,
  IAIChatExecutionPort,
} from '../../ports';
import { createLogger } from '@dailyuse/utils';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from './ai-provider-resolution';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';

const logger = createLogger('AIChatApplicationService');

/**
 * AI Chat Application Service
 */
export class AIChatApplicationService {
  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  /**
   * Send a message and get a complete response
   */
  async sendMessage(
    identityId: string,
    conversationId: string,
    content: string,
    providerId?: string,
    model?: string,
  ): Promise<SendMessageRes> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const conversation = await this.validateAndGetConversation(identityId, conversationId);
      const userMessage = await this.saveMessage(conversation, MessageRole.User, content);
      const history = await this.getConversationHistory(conversationId);
      const providerConfig = await this.getProviderConfig(identityId, providerId);
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        modelOverride: model,
        temperature: 0.7,
      });
      providerMetadata = {
        providerId: providerConfig.id,
        providerName: providerConfig.name,
        model: executionProviderConfig.model,
      };
      const completion = await this.chatExecutionPort.complete({
        identityId,
        messages: this.toExecutionMessages(history),
        providerConfig: executionProviderConfig,
        requestId,
      });
      const assistantMessage = await this.saveMessage(
        conversation,
        MessageRole.Assistant,
        completion.content,
      );

      const result = {
        userMessage,
        assistantMessage,
        tokenUsage: completion.usage,
        providerId: providerConfig.id,
        processingTimeMs: Date.now() - startedAt,
      };

      await this.recordExecution({
        identityId,
        taskType: 'CHAT_COMPLETE',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          conversationId,
          contentLength: content.length,
          selectedProviderId: providerId,
          modelOverride: model,
        },
        result: {
          assistantMessageId: String(assistantMessage.id),
          finishReason: completion.finishReason,
        },
        tokenUsage: completion.usage,
        processingMs: result.processingTimeMs,
      });

      return result;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'CHAT_COMPLETE',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          conversationId,
          contentLength: content.length,
          selectedProviderId: providerId,
          modelOverride: model,
        },
        error: error instanceof Error ? error.message : 'Chat execution failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('AI Chat Failed', {
        error,
        identityId,
        conversationId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
    }
  }

  /**
   * Send a message and stream the response
   */
  async sendMessageStream(
    identityId: string,
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    providerId?: string,
    model?: string,
  ): Promise<{
    userMessage: MessageClientDTO;
    assistantMessage: MessageClientDTO;
    tokenUsage: ChatExecutionUsage;
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};
    let fullContent = '';
    let finishReason = 'stop';

    try {
      const conversation = await this.validateAndGetConversation(identityId, conversationId);
      const userMessage = await this.saveMessage(conversation, MessageRole.User, content);
      const history = await this.getConversationHistory(conversationId);
      const providerConfig = await this.getProviderConfig(identityId, providerId);
      const messages = this.toExecutionMessages(history);
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        modelOverride: model,
        temperature: 0.7,
      });
      providerMetadata = {
        providerId: providerConfig.id,
        providerName: providerConfig.name,
        model: executionProviderConfig.model,
      };

      for await (const chunk of this.chatExecutionPort.stream({
        identityId,
        messages,
        providerConfig: executionProviderConfig,
        requestId,
      })) {
        if (!chunk.content && !chunk.finishReason) {
          continue;
        }
        fullContent += chunk.content;
        finishReason = chunk.finishReason ?? finishReason;
        if (chunk.content) {
          onChunk({
            content: chunk.content,
            role: 'assistant',
          });
        }
      }

      const assistantMessage = await this.saveMessage(
        conversation,
        MessageRole.Assistant,
        fullContent,
      );
      const result = {
        userMessage,
        assistantMessage,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        providerId: providerConfig.id as SendMessageRes['providerId'],
        processingTimeMs: Date.now() - startedAt,
      };
      await this.recordExecution({
        identityId,
        taskType: 'CHAT_STREAM',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          conversationId,
          contentLength: content.length,
          selectedProviderId: providerId,
          modelOverride: model,
        },
        result: {
          assistantMessageId: String(assistantMessage.id),
          streamedCharacters: fullContent.length,
          finishReason,
        },
        tokenUsage: result.tokenUsage,
        processingMs: result.processingTimeMs,
      });
      return result;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'CHAT_STREAM',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          conversationId,
          contentLength: content.length,
          selectedProviderId: providerId,
          modelOverride: model,
        },
        result: {
          finishReason,
          streamedCharacters: fullContent.length,
        },
        error: error instanceof Error ? error.message : 'Chat stream failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('AI Stream Failed', {
        error,
        finishReason,
        identityId,
        conversationId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
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

    return message.toClientDTO();
  }

  private async getConversationHistory(conversationId: string): Promise<MessageClientDTO[]> {
    const conversation = await this.conversationRepository.findById(conversationId, {
      includeChildren: true,
    });
    if (!conversation) {
      return [];
    }

    return conversation.getAllMessages().map((message) => message.toClientDTO());
  }

  private async getProviderConfig(identityId: string, providerId?: string) {
    return resolveActiveProviderConfig(this.providerConfigRepository, identityId, providerId);
  }

  private async recordExecution(
    input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
  ): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (error) {
      logger.warn('Failed to record chat execution log', {
        error,
        identityId: input.identityId,
        taskType: input.taskType,
      });
    }
  }

  private toExecutionMessages(history: MessageClientDTO[]): ChatExecutionMessage[] {
    const systemMessage: ChatExecutionMessage = {
      role: 'system',
      content: 'You are a helpful assistant.',
    };

    return [
      systemMessage,
      ...history.map((message) => ({
        role: this.toExecutionRole(message.role),
        content: message.content,
      })),
    ];
  }

  private toExecutionRole(role: MessageClientDTO['role']): ChatExecutionMessage['role'] {
    switch (role) {
      case MessageRole.User:
        return 'user';
      case MessageRole.Assistant:
        return 'assistant';
      case MessageRole.System:
        return 'system';
      default:
        logger.warn('Unknown message role received, defaulting to user', { role });
        return 'user';
    }
  }
}
