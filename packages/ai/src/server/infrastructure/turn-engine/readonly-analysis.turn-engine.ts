/**
 * ReadonlyAnalysisTurnEngine — second production Turn Engine (ADR-035 residual 341).
 *
 * Occupies the frozen `engine.pi_readonly` capability kind as a Host-managed
 * readonly analysis engine that completes only through IModelGatewayPort.
 * This is not the Pi SDK spike (stage 5 still open for real Pi version/isolation).
 *
 * Invariants:
 * - Never exposes mutation tools or knowledge-write execution
 * - Never silent-emits engine.* offers
 * - Credentials stay request-scoped via Model Gateway (modelBindingId only)
 * - Not the open-chat default path (DirectTurnEngine remains primary)
 */
import type { IModelGatewayPort, ITurnEnginePort } from '@memoflow/contracts/ai';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';

export const PI_READONLY_TURN_ENGINE_ID = 'engine.pi_readonly' as const;

const READONLY_SYSTEM_PROMPT =
  'You are a readonly analysis assistant for MemoFlow. ' +
  'You may explain, summarize, and draft text only. ' +
  'You cannot execute tools, mutate product data, write vault files, or expand capabilities.';

export class ReadonlyAnalysisTurnEngine implements ITurnEnginePort {
  readonly engineId = PI_READONLY_TURN_ENGINE_ID;

  private readonly controllers = new Map<string, AbortController>();
  private readonly runOwners = new Map<string, string>();

  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly modelGateway: IModelGatewayPort,
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
    // conversationId is accepted for Host routing parity but this engine never
    // opens mutation/tool paths; analysis is always gateway-complete only.
    void input.conversationId;

    const existingOwner = this.runOwners.get(input.runId);
    if (existingOwner && existingOwner !== input.identityId) {
      return { status: 'failed', error: 'FORBIDDEN: turn run ownership mismatch' };
    }

    const existing = this.controllers.get(input.runId);
    if (existing) {
      if (!existing.signal.aborted) {
        existing.abort();
      }
      this.controllers.delete(input.runId);
    }

    const controller = new AbortController();
    this.controllers.set(input.runId, controller);
    this.runOwners.set(input.runId, input.identityId);

    const onExternalAbort = () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
    input.signal?.addEventListener('abort', onExternalAbort, { once: true });

    const cleanup = () => {
      input.signal?.removeEventListener('abort', onExternalAbort);
      this.controllers.delete(input.runId);
      this.runOwners.delete(input.runId);
    };

    try {
      if (controller.signal.aborted || input.signal?.aborted) {
        return { status: 'aborted' };
      }

      const providerConfig = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        input.identityId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(providerConfig, {
        temperature: 0.3,
      });

      const result = await this.modelGateway.complete({
        auth: {
          bindingId: `${executionProviderConfig.provider}:${executionProviderConfig.model}`,
          baseUrl: executionProviderConfig.baseUrl ?? 'https://api.openai.com/v1',
          apiKey: executionProviderConfig.apiKey,
        },
        model: executionProviderConfig.model,
        temperature: executionProviderConfig.temperature ?? 0.3,
        maxTokens: executionProviderConfig.maxTokens,
        responseFormat: 'text',
        messages: [
          { role: 'system', content: READONLY_SYSTEM_PROMPT },
          { role: 'user', content: input.message },
        ],
        signal: controller.signal,
      });

      // Never put credentials on the public result path.
      if (JSON.stringify(result).includes(executionProviderConfig.apiKey)) {
        return { status: 'failed', error: 'INTERNAL_ERROR: credential leak blocked' };
      }

      if (controller.signal.aborted) {
        return { status: 'aborted' };
      }
      if (!result.content?.trim()) {
        return { status: 'failed', error: 'Provider returned empty content' };
      }
      return { status: 'completed' };
    } catch (error) {
      if (
        controller.signal.aborted ||
        input.signal?.aborted ||
        (error instanceof Error &&
          (error.name === 'AbortError' || /abort/i.test(error.message)))
      ) {
        return { status: 'aborted' };
      }
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Readonly analysis turn failed',
      };
    } finally {
      cleanup();
    }
  }
}
