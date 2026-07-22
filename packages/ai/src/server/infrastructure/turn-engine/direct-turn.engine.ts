/**
 * DirectTurnEngine — first production Turn Engine (ADR-035 stage 4 / residual 314).
 *
 * Open-ended chat/analysis only. Wraps IAIChatExecutionPort + provider/conversation
 * resolution. Never exposes mutation tools or knowledge-write capabilities; those stay
 * on the Agent Host proposal/executor path.
 */
import type { ITurnEnginePort } from '@dailyuse/contracts/ai';
import { MessageRole } from '@dailyuse/contracts/ai';
import type { IAIConversationRepository } from '../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import type { IAIChatExecutionPort } from '../../application/ports';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';
import {
  getConversationHistory,
  saveMessage,
  toExecutionMessages,
  validateAndGetConversation,
} from '../../application/use-cases/commands/ai-chat-helpers';

export const DIRECT_TURN_ENGINE_ID = 'engine.direct_turn' as const;

export class DirectTurnEngine implements ITurnEnginePort {
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
    const owner = this.runOwners.get(input.runId);
    if (owner && owner !== input.identityId) {
      return { status: 'failed', error: 'OWNERSHIP_MISMATCH' };
    }
    this.runOwners.set(input.runId, input.identityId);

    if (input.signal?.aborted) {
      return { status: 'aborted' };
    }

    const controller = new AbortController();
    this.controllers.set(input.runId, controller);

    const onExternalAbort = () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
    input.signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }

      let messages;
      if (input.conversationId) {
        const conversation = await validateAndGetConversation(
          this.conversationRepository,
          input.identityId,
          input.conversationId,
        );
        await saveMessage(
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
        messages = toExecutionMessages(history);
      } else {
        messages = [
          { role: 'system' as const, content: 'You are a helpful assistant.' },
          { role: 'user' as const, content: input.message },
        ];
      }

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

      const completion = await this.chatExecutionPort.complete({
        identityId: input.identityId,
        messages,
        providerConfig: executionProviderConfig,
        requestId: input.runId,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }

      if (input.conversationId) {
        const conversation = await validateAndGetConversation(
          this.conversationRepository,
          input.identityId,
          input.conversationId,
        );
        await saveMessage(
          this.conversationRepository,
          conversation,
          MessageRole.Assistant,
          completion.content,
        );
      }

      return { status: 'completed' };
    } catch (error) {
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
    } finally {
      input.signal?.removeEventListener('abort', onExternalAbort);
      this.controllers.delete(input.runId);
    }
  }
}
