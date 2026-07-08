import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import type { MessageClientDTO, SendMessageRes } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type {
  ChatExecutionUsage,
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
  isAbortLikeError,
  createStreamAbortError,
} from './ai-chat-helpers';

const logger = createLogger('StreamAIMessageUseCase');

/**
 * Send a message and stream the response
 */
export class StreamAIMessageUseCase {
  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async execute(
    conversationId: string,
    content: string,
    onChunk: (chunk: { content: string; role: 'assistant' }) => void,
    cx: ExecutionContext,
    providerId?: string,
    model?: string,
    signal?: AbortSignal,
  ): Promise<Result<{
    userMessage: MessageClientDTO;
    assistantMessage: MessageClientDTO;
    tokenUsage: ChatExecutionUsage;
    providerId: SendMessageRes['providerId'];
    processingTimeMs: number;
  }>> {
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
      const messages = toExecutionMessages(history);
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        modelOverride: model,
        temperature: 0.7,
      });
      providerMetadata = {
        providerId: providerConfig.id,
        providerName: providerConfig.name,
        model: executionProviderConfig.model,
      };

      try {
        for await (const chunk of this.chatExecutionPort.stream({
          identityId: cx.identityId,
          messages,
          providerConfig: executionProviderConfig,
          requestId,
          signal,
        })) {
          if (signal?.aborted) {
            throw createStreamAbortError();
          }

          fullContent += chunk.content;

          if (chunk.finishReason) {
            finishReason = chunk.finishReason;
          }

          if (chunk.content) {
            onChunk({
              content: chunk.content,
              role: 'assistant',
            });
          }
        }
      } catch (streamError) {
        if (signal?.aborted || isAbortLikeError(streamError)) {
          logger.info('[StreamAIMessageUseCase] Stream aborted by client', {
            contentReceived: fullContent.length,
            requestId,
          });
          throw streamError;
        }

        logger.warn('[StreamAIMessageUseCase] Stream processing error', {
          streamError: streamError instanceof Error ? streamError.message : String(streamError),
          contentReceived: fullContent.length,
          requestId,
        });
        if (fullContent.length === 0) {
          throw streamError;
        }
      }

      if (finishReason === 'error' || (!finishReason && fullContent.length === 0)) {
        const errorMsg = `AI stream failed to complete: finish_reason="${finishReason}", content_length=${fullContent.length}`;
        logger.error('[StreamAIMessageUseCase] Stream validation failed', {
          finishReason,
          contentLength: fullContent.length,
          requestId,
        });
        return error('INTERNAL_ERROR', errorMsg);
      }

      const assistantMessage = await saveMessage(
        this.conversationRepository,
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
        identityId: cx.identityId,
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
      return ok(result);
    } catch (err) {
      await this.recordExecution({
        identityId: cx.identityId,
        taskType: 'CHAT_STREAM',
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
        result: {
          finishReason,
          streamedCharacters: fullContent.length,
        },
        error: err instanceof Error ? err.message : 'Chat stream failed',
        processingMs: Date.now() - startedAt,
      });
      if (isAbortLikeError(err)) {
        logger.info('AI Stream Aborted', {
          finishReason,
          identityId: cx.identityId,
          conversationId,
          requestId,
        });
      } else {
        logger.error('AI Stream Failed', {
          error: err,
          finishReason,
          identityId: cx.identityId,
          conversationId,
          requestId,
        });
      }
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
