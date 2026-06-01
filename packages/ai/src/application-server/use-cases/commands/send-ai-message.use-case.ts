import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain-server/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import type { SendMessageRes } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type {
  IAIExecutionLogPort,
  IAIChatExecutionPort,
} from '../../ports';
import { createLogger } from '@dailyuse/utils/logger';
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
import {
  validateAndGetConversation,
  saveMessage,
  getConversationHistory,
  toExecutionMessages,
} from './ai-chat-helpers';

const logger = createLogger('SendAIMessageUseCase');

/**
 * Send a message and get a complete response
 */
export class SendAIMessageUseCase {
  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async execute(
    conversationId: string,
    content: string,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
  ): Promise<Result<SendMessageRes>> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const conversation = await validateAndGetConversation(
        this.conversationRepository,
        cx.identityId,
        conversationId,
      );
      const userMessage = await saveMessage(
        this.conversationRepository,
        conversation,
        MessageRole.User,
        content,
      );
      const history = await getConversationHistory(this.conversationRepository, conversationId);
      const providerConfig = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        cx.identityId,
        providerId,
      );
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
        identityId: cx.identityId,
        messages: toExecutionMessages(history),
        providerConfig: executionProviderConfig,
        requestId,
      });
      const assistantMessage = await saveMessage(
        this.conversationRepository,
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
        identityId: cx.identityId,
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

      return ok(result);
    } catch (err) {
      await this.recordExecution({
        identityId: cx.identityId,
        taskType: 'CHAT_COMPLETE',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(err),
        input: {
          conversationId,
          contentLength: content.length,
          selectedProviderId: providerId,
          modelOverride: model,
        },
        error: err instanceof Error ? err.message : 'Chat execution failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('AI Chat Failed', {
        error: err,
        identityId: cx.identityId,
        conversationId,
        requestId,
      });
      const enriched = attachRequestIdToError(err, requestId);
      return error('INTERNAL_ERROR', enriched.message);
    }
  }

  private async recordExecution(
    input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
  ): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (err) {
      logger.warn('Failed to record chat execution log', {
        error: err,
        identityId: input.identityId,
        taskType: input.taskType,
      });
    }
  }
}
