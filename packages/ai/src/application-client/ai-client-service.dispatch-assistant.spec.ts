/**
 * AIClientService.dispatchAssistant policy behavior (plan Step D §4.5 / §5.5).
 *
 * Host dispatch is the default; the legacy `streamMessage` fallback exists only
 * inside the service as a narrow version-compatibility adapter. It fires exactly
 * once and ONLY on a definite dispatch-unavailable + zero observed events.
 */
import { describe, expect, it, vi } from 'vitest';
import { AIClientService } from './ai-client-service';
import {
  classifyAssistantDispatchFallback,
  type AssistantDispatchPolicy,
} from './assistant-dispatch-policy';
import { createResultClientError } from '../infrastructure-client/adapters/result-client-error';
import type { IAIAssistantApiClient, IAIMessageApiClient } from './ports/ai-api-client.port';
import type { AssistantClientCommand, AssistantDispatchHandlers } from '@memoflow/contracts/ai';
import { ASSISTANT_DISPATCH_UNAVAILABLE } from '@memoflow/contracts/ai';

type MinimalApis = {
  assistant: {
    dispatchAssistant: ReturnType<typeof vi.fn>;
  };
  message: {
    streamMessage: ReturnType<typeof vi.fn>;
  };
};

function createMinimalApis(): MinimalApis {
  return {
    assistant: {
      dispatchAssistant: vi.fn(async () => {}),
    },
    message: {
      streamMessage: vi.fn(async () => {}),
    },
  };
}

function createService(
  apis: MinimalApis,
  dispatchPolicy: AssistantDispatchPolicy = 'prefer_dispatch',
) {
  return new AIClientService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    apis.message as unknown as IAIMessageApiClient,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    apis.assistant as unknown as IAIAssistantApiClient,
    dispatchPolicy,
  );
}

function messageCommand(overrides: Partial<AssistantClientCommand> = {}): AssistantClientCommand {
  return {
    type: 'message',
    conversationId: 'conv-1',
    content: 'hello',
    surface: 'web',
    ...overrides,
  } as AssistantClientCommand;
}

function makeHandlers(): AssistantDispatchHandlers & { events: unknown[]; done: unknown[] } {
  const events: unknown[] = [];
  const done: unknown[] = [];
  return {
    events,
    done,
    onEvent: (event) => events.push(event),
    onDone: (result) => done.push(result),
  };
}

describe('classifyAssistantDispatchFallback (pure §4.5 whitelist)', () => {
  const unavailable = createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE);

  it('eligible only for direct_turn message + unavailable + zero events', () => {
    expect(
      classifyAssistantDispatchFallback(unavailable, messageCommand(), { sawEvent: false }),
    ).toBe(true);
  });

  it('fails closed for every non-message command and pi_readonly', () => {
    const notMessage = {
      type: 'cancel_run',
      runId: 'r1',
    } as AssistantClientCommand;
    expect(classifyAssistantDispatchFallback(unavailable, notMessage, { sawEvent: false })).toBe(
      false,
    );

    expect(
      classifyAssistantDispatchFallback(
        unavailable,
        messageCommand({ executionProfileId: 'pi_readonly' }),
        {
          sawEvent: false,
        },
      ),
    ).toBe(false);
  });

  it('fails closed once any event is observed (run.started) and for all other errors', () => {
    expect(
      classifyAssistantDispatchFallback(unavailable, messageCommand(), { sawEvent: true }),
    ).toBe(false);

    const forbiddenErrors = [
      new Error('network down'),
      createResultClientError('timeout', 'TIMEOUT'),
      createResultClientError('aborted', 'ABORTED'),
      createResultClientError('terminated', 'STREAM_TERMINATED'),
      createResultClientError('unauthorized', 'UNAUTHORIZED'),
      createResultClientError('bad', 'VALIDATION_ERROR'),
      createResultClientError('rate', 'RATE_LIMITED'),
      createResultClientError('provider', 'PROVIDER_ERROR'),
      createResultClientError('protocol', 'ASSISTANT_PROTOCOL_ERROR'),
      undefined,
    ];
    for (const error of forbiddenErrors) {
      expect(classifyAssistantDispatchFallback(error, messageCommand(), { sawEvent: false })).toBe(
        false,
      );
    }
  });
});

describe('AIClientService.dispatchAssistant (plan Step D)', () => {
  it('forwards dispatch success untouched: delta/completed pass through, no legacy call', async () => {
    const apis = createMinimalApis();
    apis.assistant.dispatchAssistant.mockImplementation(async (_command, handlers) => {
      handlers.onEvent?.({ type: 'message.delta', runId: 'run-1', content: 'hi' });
      handlers.onEvent?.({ type: 'message.completed', runId: 'run-1', status: 'completed' });
      handlers.onDone?.({ eventCount: 2 });
    });
    const service = createService(apis, 'prefer_dispatch');
    const handlers = makeHandlers();

    await service.dispatchAssistant(messageCommand(), handlers);

    expect(apis.assistant.dispatchAssistant).toHaveBeenCalledTimes(1);
    expect(apis.message.streamMessage).not.toHaveBeenCalled();
    expect(handlers.events).toMatchObject([
      { type: 'message.delta', runId: 'run-1' },
      { type: 'message.completed', status: 'completed' },
    ]);
    expect(handlers.done).toEqual([{ eventCount: 2 }]);
  });

  it('falls back exactly once on definite unavailable + zero events, mapping conversation/content/provider/model', async () => {
    const apis = createMinimalApis();
    apis.assistant.dispatchAssistant.mockRejectedValue(
      createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE),
    );
    apis.message.streamMessage.mockImplementation(async (request, streamHandlers) => {
      streamHandlers.onChunk?.({ role: 'assistant', content: 'legacy' });
      streamHandlers.onDone?.({
        userMessage: { id: 'user-9', content: 'hello' },
        assistantMessage: { id: 'assistant-9', content: 'legacy' },
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        providerId: 'provider-1',
        processingTimeMs: 1,
      } as never);
    });
    const service = createService(apis, 'prefer_dispatch');
    const handlers = makeHandlers();
    const command = messageCommand({
      runId: 'run-client-1',
      providerId: 'provider-1',
      model: 'model-1',
    });

    await service.dispatchAssistant(command, handlers);

    expect(apis.assistant.dispatchAssistant).toHaveBeenCalledTimes(1);
    expect(apis.message.streamMessage).toHaveBeenCalledTimes(1);
    expect(apis.message.streamMessage.mock.calls[0][0]).toEqual({
      conversationId: 'conv-1',
      content: 'hello',
      providerId: 'provider-1',
      model: 'model-1',
    });
    expect(handlers.events).toMatchObject([
      { type: 'message.delta', runId: 'run-client-1', content: 'legacy' },
      {
        type: 'message.completed',
        runId: 'run-client-1',
        status: 'completed',
        content: 'legacy',
        userMessage: { id: 'user-9', content: 'hello' },
        assistantMessage: { id: 'assistant-9', content: 'legacy' },
      },
    ]);
    // Fallback never fabricates run.started.
    expect(
      handlers.events.some((event) => (event as { type: string }).type === 'run.started'),
    ).toBe(false);
  });

  it('preserves a generated runId when the command omitted one', async () => {
    const apis = createMinimalApis();
    apis.assistant.dispatchAssistant.mockRejectedValue(
      createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE),
    );
    apis.message.streamMessage.mockImplementation(async (_request, streamHandlers) => {
      streamHandlers.onChunk?.({ role: 'assistant', content: 'x' });
    });
    const service = createService(apis);
    const handlers = makeHandlers();

    await service.dispatchAssistant(messageCommand(), handlers);

    const delta = handlers.events[0] as { type: string; runId: string };
    expect(delta.type).toBe('message.delta');
    expect(delta.runId).toMatch(/^legacy:/);
  });

  it('rejects fallback when run.started was observed, and for network/timeout/abort/protocol errors', async () => {
    const cases: Array<[unknown, boolean]> = [
      [createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE), true],
      [createResultClientError('network', 'NETWORK_ERROR'), false],
      [createResultClientError('timeout', 'TIMEOUT'), false],
      [createResultClientError('aborted', 'ABORTED'), false],
      [createResultClientError('terminated', 'STREAM_TERMINATED'), false],
      [createResultClientError('auth', 'UNAUTHORIZED'), false],
      [createResultClientError('validation', 'VALIDATION_ERROR'), false],
      [createResultClientError('protocol', 'ASSISTANT_PROTOCOL_ERROR'), false],
    ];

    for (const [error, shouldFallback] of cases) {
      const apis = createMinimalApis();
      apis.assistant.dispatchAssistant.mockImplementation(async (_command, handlers) => {
        if (shouldFallback) {
          throw error;
        }
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'r',
          engineId: 'e',
          profile: 'direct_turn',
        });
        throw error;
      });
      const service = createService(apis);
      const handlers = makeHandlers();

      if (shouldFallback) {
        await expect(
          service.dispatchAssistant(messageCommand(), handlers),
        ).resolves.toBeUndefined();
        expect(apis.message.streamMessage).toHaveBeenCalledTimes(1);
      } else {
        await expect(service.dispatchAssistant(messageCommand(), handlers)).rejects.toBe(error);
        expect(apis.message.streamMessage).not.toHaveBeenCalled();
      }
    }
  });

  it('pi_readonly, proposal and cancel commands never fall back', async () => {
    const unavailable = createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE);
    const commands: AssistantClientCommand[] = [
      messageCommand({ executionProfileId: 'pi_readonly' }),
      { type: 'approve_proposal', runId: 'r', proposalId: 'p', revision: 1 },
      { type: 'revise_proposal', runId: 'r', proposalId: 'p', revision: 1, patch: {} },
      { type: 'reject_proposal', runId: 'r', proposalId: 'p', revision: 1 },
      { type: 'cancel_run', runId: 'r' },
    ];

    for (const command of commands) {
      const apis = createMinimalApis();
      apis.assistant.dispatchAssistant.mockRejectedValue(unavailable);
      const service = createService(apis);
      const handlers = makeHandlers();

      await expect(service.dispatchAssistant(command, handlers)).rejects.toBe(unavailable);
      expect(apis.message.streamMessage).not.toHaveBeenCalled();
    }
  });

  it('dispatch_only never falls back even on definite unavailable', async () => {
    const apis = createMinimalApis();
    apis.assistant.dispatchAssistant.mockRejectedValue(
      createResultClientError('route missing', ASSISTANT_DISPATCH_UNAVAILABLE),
    );
    const service = createService(apis, 'dispatch_only');
    const handlers = makeHandlers();

    await expect(service.dispatchAssistant(messageCommand(), handlers)).rejects.toMatchObject({
      code: ASSISTANT_DISPATCH_UNAVAILABLE,
    });
    expect(apis.message.streamMessage).not.toHaveBeenCalled();
  });

  it('legacy_only runs streamMessage projection for direct_turn messages', async () => {
    const apis = createMinimalApis();
    apis.message.streamMessage.mockImplementation(async (_request, streamHandlers) => {
      streamHandlers.onChunk?.({ role: 'assistant', content: 'legacy reply' });
      streamHandlers.onDone?.({
        userMessage: { id: 'u1', content: 'hello' },
        assistantMessage: { id: 'a1', content: 'legacy reply' },
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        providerId: 'provider-1',
        processingTimeMs: 1,
      } as never);
    });
    const service = createService(apis, 'legacy_only');
    const handlers = makeHandlers();
    const command = messageCommand({ runId: 'run-1' });

    await service.dispatchAssistant(command, handlers);

    expect(apis.assistant.dispatchAssistant).not.toHaveBeenCalled();
    expect(apis.message.streamMessage).toHaveBeenCalledTimes(1);
    expect(apis.message.streamMessage.mock.calls[0][0]).toEqual({
      conversationId: 'conv-1',
      content: 'hello',
      providerId: undefined,
      model: undefined,
    });
    expect(handlers.events).toMatchObject([
      { type: 'message.delta', runId: 'run-1' },
      { type: 'message.completed', runId: 'run-1', status: 'completed' },
    ]);
  });

  it('legacy_only fails explicitly for pi_readonly and proposal/cancel (never sent to message endpoint)', async () => {
    const commands: AssistantClientCommand[] = [
      messageCommand({ executionProfileId: 'pi_readonly' }),
      { type: 'approve_proposal', runId: 'r', proposalId: 'p', revision: 1 },
      { type: 'cancel_run', runId: 'r' },
    ];

    for (const command of commands) {
      const apis = createMinimalApis();
      const service = createService(apis, 'legacy_only');
      const handlers = makeHandlers();

      await expect(service.dispatchAssistant(command, handlers)).rejects.toMatchObject({
        code: 'ASSISTANT_DISPATCH_UNSUPPORTED',
      });
      expect(apis.message.streamMessage).not.toHaveBeenCalled();
      expect(apis.assistant.dispatchAssistant).not.toHaveBeenCalled();
    }
  });
});
