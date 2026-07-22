/**
 * DirectTurnEngine — first production Turn Engine (ADR-035 stage 4).
 *
 * Residual 314: ITurnEnginePort implementation.
 * Residual 316: IOpenChatTurnPort so open chat send/stream use cases route through
 * this engine (not a parallel IAIChatExecutionPort bypass).
 *
 * Open-ended chat/analysis only. Never exposes mutation tools or knowledge-write
 * capabilities; those stay on the Agent Host proposal/executor path.
 */
import type { ITurnEnginePort } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { IAIConversationRepository } from '../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import type {
  ChatExecutionUsage,
  IAIChatExecutionPort,
  IOpenChatTurnPort,
  OpenChatTurnInput,
  OpenChatTurnResult,
} from '../../application/ports';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';
import {
  createStreamAbortError,
  getConversationHistory,
  isAbortLikeError,
  saveMessage,
  toExecutionMessages,
  validateAndGetConversation,
} from '../../application/use-cases/commands/ai-chat-helpers';

export const DIRECT_TURN_ENGINE_ID = 'engine.direct_turn' as const;

const EMPTY_USAGE: ChatExecutionUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

export class DirectTurnEngine implements ITurnEnginePort, IOpenChatTurnPort {
  readonly engineId = DIRECT_TURN_ENGINE_ID;

  private readonly controllers = new Map<string, AbortController>();
  private readonly runOwners = new Map<string, string>();

  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
  ) {}

  async abort(runId: string): Promise<void> {
    const controller = this.controllers.get(runId);
    if (controller && !controller.signal.aborted) {
      controller.abort();
    }
  }

  async startTurn(input: {
    runId: string;
    identityId: string;
    conversationId?: string;
    message: string;
    signal?: AbortSignal;
  }): Promise<{ status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'; error?: string }> {
    if (input.conversationId) {
      const result = await this.executeConversationTurn({
        runId: input.runId,
        identityId: input.identityId,
        conversationId: input.conversationId,
        message: input.message,
        signal: input.signal,
      });
      return { status: result.status, error: result.error };
    }

    return this.startAnalysisTurn(input);
  }

  async executeConversationTurn(input: OpenChatTurnInput): Promise<OpenChatTurnResult> {
    return this.runConversationTurn(input, 'complete');
  }

  async streamConversationTurn(
    input: OpenChatTurnInput,
    onChunk: (chunk: { content: string }) => void,
  ): Promise<OpenChatTurnResult> {
    return this.runConversationTurn(input, 'stream', onChunk);
  }

  private async startAnalysisTurn(input: {
    runId: string;
    identityId: string;
    message: string;
    signal?: AbortSignal;
  }): Promise<{ status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'; error?: string }> {
    const ownership = this.beginRun(input.runId, input.identityId, input.signal);
    if (ownership.early) {
      return ownership.early;
    }
    const { controller, cleanup } = ownership;

    try {
      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }

      const providerConfig = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        input.identityId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        temperature: 0.7,
      });

      await this.chatExecutionPort.complete({
        identityId: input.identityId,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: input.message },
        ],
        providerConfig: executionProviderConfig,
        requestId: input.runId,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }
      return { status: 'completed' };
    } catch (error) {
      return this.mapFailure(error, controller);
    } finally {
      cleanup();
    }
  }

  private async runConversationTurn(
    input: OpenChatTurnInput,
    mode: 'complete' | 'stream',
    onChunk?: (chunk: { content: string }) => void,
  ): Promise<OpenChatTurnResult> {
    const ownership = this.beginRun(input.runId, input.identityId, input.signal);
    if (ownership.early) {
      return ownership.early;
    }
    const { controller, cleanup } = ownership;

    try {
      // Do not fail-closed before conversation load/stream invocation: open-chat use cases
      // still persist the user message and pass the client signal into chatExecution.stream.

      const conversation = await validateAndGetConversation(
        this.conversationRepository,
        input.identityId,
        input.conversationId,
      );
      const userMessage = await saveMessage(
        this.conversationRepository,
        conversation,
        MessageRole.User,
        input.message,
      );
      const history = await getConversationHistory(
        this.conversationRepository,
        input.identityId,
        input.conversationId,
      );
      const messages = toExecutionMessages(history);

      const providerConfig = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        input.identityId,
        input.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        modelOverride: input.model,
        temperature: 0.7,
      });

      let content = '';
      let finishReason = 'stop';
      let usage: ChatExecutionUsage = EMPTY_USAGE;

      if (mode === 'complete') {
        if (controller.signal.aborted) {
          return { status: 'aborted' };
        }
        const completion = await this.chatExecutionPort.complete({
          identityId: input.identityId,
          messages,
          providerConfig: executionProviderConfig,
          requestId: input.runId,
          signal: controller.signal,
        });
        content = completion.content;
        finishReason = completion.finishReason;
        usage = completion.usage;
      } else {
        try {
          for await (const chunk of this.chatExecutionPort.stream({
            identityId: input.identityId,
            messages,
            providerConfig: executionProviderConfig,
            requestId: input.runId,
            signal: controller.signal,
          })) {
            if (controller.signal.aborted || input.signal?.aborted) {
              throw createStreamAbortError();
            }
            content += chunk.content;
            if (chunk.finishReason) {
              finishReason = chunk.finishReason;
            }
            if (chunk.content) {
              onChunk?.({ content: chunk.content });
            }
          }
        } catch (streamError) {
          if (controller.signal.aborted || input.signal?.aborted || isAbortLikeError(streamError)) {
            return { status: 'aborted' };
          }
          if (content.length === 0) {
            throw streamError;
          }
        }

        if (finishReason === 'error' || (!finishReason && content.length === 0)) {
          return {
            status: 'failed',
            error: `AI stream failed to complete: finish_reason="${finishReason}", content_length=${content.length}`,
          };
        }
      }

      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }

      const assistantMessage = await saveMessage(
        this.conversationRepository,
        conversation,
        MessageRole.Assistant,
        content,
      );

      return {
        status: 'completed',
        content,
        finishReason,
        usage,
        providerId: providerConfig.id,
        providerName: providerConfig.name,
        model: executionProviderConfig.model,
        userMessage,
        assistantMessage,
      };
    } catch (error) {
      return this.mapOpenChatFailure(error, controller);
    } finally {
      cleanup();
    }
  }

  private beginRun(
    runId: string,
    identityId: string,
    signal?: AbortSignal,
  ):
    | { early: OpenChatTurnResult; controller?: undefined; cleanup?: undefined }
    | { early?: undefined; controller: AbortController; cleanup: () => void } {
    const owner = this.runOwners.get(runId);
    if (owner && owner !== identityId) {
      return { early: { status: 'failed', error: 'OWNERSHIP_MISMATCH' } };
    }
    this.runOwners.set(runId, identityId);

    const controller = new AbortController();
    this.controllers.set(runId, controller);
    const onExternalAbort = () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
    // Mirror pre-aborted external signals onto the run controller so stream/complete
    // still observe AbortSignal (open-chat use cases may call stream with an already
    // aborted client signal).
    if (signal?.aborted) {
      controller.abort();
    } else {
      signal?.addEventListener('abort', onExternalAbort, { once: true });
    }

    return {
      controller,
      cleanup: () => {
        signal?.removeEventListener('abort', onExternalAbort);
        this.controllers.delete(runId);
      },
    };
  }

  private mapFailure(
    error: unknown,
    controller: AbortController,
  ): { status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'; error?: string } {
    if (
      controller.signal.aborted ||
      (error instanceof Error && (error.name === 'AbortError' || /aborted/i.test(error.message)))
    ) {
      return { status: 'aborted' };
    }
    const message = error instanceof Error ? error.message : 'TURN_FAILED';
    if (/not found/i.test(message)) {
      return { status: 'failed', error: 'CONVERSATION_NOT_FOUND' };
    }
    if (/No AI provider configured/i.test(message)) {
      return { status: 'failed', error: 'PROVIDER_UNAVAILABLE' };
    }
    return { status: 'failed', error: message };
  }

  private mapOpenChatFailure(error: unknown, controller: AbortController): OpenChatTurnResult {
    const mapped = this.mapFailure(error, controller);
    return { status: mapped.status === 'waiting_approval' ? 'failed' : mapped.status, error: mapped.error };
  }
}
