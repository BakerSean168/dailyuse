import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { SendMessageRes } from '@dailyuse/contracts/ai';
import type { AIExecutionLogInput, IAIExecutionLogPort, IOpenChatTurnPort } from '../../ports';
import { createLogger } from '@dailyuse/utils/logger';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';

const logger = createLogger('SendAIMessageUseCase');

/**
 * Send a message and get a complete response.
 *
 * Residual 316: open chat routes through the Turn Engine (IOpenChatTurnPort /
 * DirectTurnEngine), not a parallel IAIChatExecutionPort bypass.
 */
export class SendAIMessageUseCase {
  constructor(
    private readonly openChatTurn: IOpenChatTurnPort,
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
      const turn = await this.openChatTurn.executeConversationTurn({
        runId: requestId,
        identityId: cx.identityId,
        conversationId,
        message: content,
        providerId,
        model,
      });

      providerMetadata = {
        providerId: turn.providerId,
        providerName: turn.providerName,
        model: turn.model,
      };

      if (turn.status === 'aborted') {
        const enriched = attachRequestIdToError(new Error('Chat turn was aborted'), requestId);
        return error('INTERNAL_ERROR', enriched.message);
      }
      if (turn.status === 'failed' || !turn.userMessage || !turn.assistantMessage || !turn.usage) {
        const message = turn.error ?? 'Chat execution failed';
        await this.recordExecution({
          identityId: cx.identityId,
          taskType: 'CHAT_COMPLETE',
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
        if (turn.error === 'OWNERSHIP_MISMATCH') {
          return error('FORBIDDEN', 'Turn ownership mismatch');
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
        taskType: 'CHAT_COMPLETE',
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
          engineId: this.openChatTurn.engineId,
        },
        error: err instanceof Error ? err.message : 'Chat execution failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('[SendAIMessageUseCase] failed', { err, requestId });
      // attachRequestIdToError returns Error, not Result — keep Result envelope.
      const enriched = attachRequestIdToError(err, requestId);
      return error(
        'INTERNAL_ERROR',
        enriched instanceof Error ? enriched.message : 'Chat execution failed',
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
      logger.warn('[SendAIMessageUseCase] failed to record execution log', { logError });
    }
  }
}
