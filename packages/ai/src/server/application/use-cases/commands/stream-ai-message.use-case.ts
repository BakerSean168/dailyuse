import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { MessageClientDTO, SendMessageRes } from '@dailyuse/contracts/ai';
import type {
  AIExecutionLogInput,
  ChatExecutionUsage,
  IAIExecutionLogPort,
  IOpenChatTurnPort,
} from '../../ports';
import { createLogger } from '@dailyuse/utils/logger';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';
import { createStreamAbortError, isAbortLikeError } from './ai-chat-helpers';

const logger = createLogger('StreamAIMessageUseCase');

/**
 * Send a message and stream the response.
 *
 * Residual 316: open chat stream routes through the Turn Engine
 * (IOpenChatTurnPort / DirectTurnEngine).
 */
export class StreamAIMessageUseCase {
  constructor(
    private readonly openChatTurn: IOpenChatTurnPort,
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
  ): Promise<
    Result<{
      userMessage: MessageClientDTO;
      assistantMessage: MessageClientDTO;
      tokenUsage: ChatExecutionUsage;
      providerId: SendMessageRes['providerId'];
      processingTimeMs: number;
    }>
  > {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const turn = await this.openChatTurn.streamConversationTurn(
        {
          runId: requestId,
          identityId: cx.identityId,
          conversationId,
          message: content,
          providerId,
          model,
          signal,
        },
        (chunk) => {
          onChunk({ content: chunk.content, role: 'assistant' });
        },
      );

      providerMetadata = {
        providerId: turn.providerId,
        providerName: turn.providerName,
        model: turn.model,
      };

      if (turn.status === 'aborted' || signal?.aborted) {
        const abortedError = createStreamAbortError();
        const enriched = attachRequestIdToError(abortedError, requestId);
        await this.recordExecution({
          identityId: cx.identityId,
          taskType: 'CHAT_STREAM',
          status: 'FAILED',
          requestId,
          ...providerMetadata,
          errorCategory: classifyAIExecutionError(abortedError),
          input: {
            conversationId,
            contentLength: content.length,
            selectedProviderId: providerId,
            modelOverride: model,
            engineId: this.openChatTurn.engineId,
          },
          error: enriched.message,
          processingMs: Date.now() - startedAt,
        });
        return error('INTERNAL_ERROR', enriched.message);
      }

      if (turn.status === 'failed' || !turn.userMessage || !turn.assistantMessage || !turn.usage) {
        const message = turn.error ?? 'Chat stream failed';
        await this.recordExecution({
          identityId: cx.identityId,
          taskType: 'CHAT_STREAM',
          status: 'FAILED',
          requestId,
          ...providerMetadata,
          errorCategory: 'EXECUTION',
          input: {
            conversationId,
            contentLength: content.length,
            selectedProviderId: providerId,
            modelOverride: model,
            engineId: this.openChatTurn.engineId,
          },
          error: message,
          processingMs: Date.now() - startedAt,
        });
        if (turn.error === 'CONVERSATION_NOT_FOUND') {
          return error('NOT_FOUND', 'Conversation not found');
        }
        if (turn.error === 'PROVIDER_UNAVAILABLE') {
          return error('SERVICE_UNAVAILABLE', 'No AI provider configured');
        }
        return error('INTERNAL_ERROR', message);
      }

      const result = {
        userMessage: turn.userMessage,
        assistantMessage: turn.assistantMessage,
        tokenUsage: turn.usage,
        providerId: turn.providerId as SendMessageRes['providerId'],
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
          engineId: this.openChatTurn.engineId,
        },
        result: {
          assistantMessageId: String(turn.assistantMessage.id),
          finishReason: turn.finishReason,
          engineId: this.openChatTurn.engineId,
        },
        tokenUsage: turn.usage,
        processingMs: result.processingTimeMs,
      });

      return ok(result);
    } catch (err) {
      if (signal?.aborted || isAbortLikeError(err)) {
        const enriched = attachRequestIdToError(err, requestId);
        return error('INTERNAL_ERROR', enriched instanceof Error ? enriched.message : String(enriched));
      }
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
          engineId: this.openChatTurn.engineId,
        },
        error: err instanceof Error ? err.message : 'Chat stream failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('[StreamAIMessageUseCase] failed', { err, requestId });
      return attachRequestIdToError(
        error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Chat stream failed'),
        requestId,
      );
    }
  }

  private async recordExecution(input: AIExecutionLogInput): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }
    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (logError) {
      logger.warn('[StreamAIMessageUseCase] failed to record execution log', { logError });
    }
  }
}
