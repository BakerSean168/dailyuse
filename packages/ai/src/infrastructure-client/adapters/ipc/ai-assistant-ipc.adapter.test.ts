import { describe, expect, it, vi } from 'vitest';
import { AIChannels, AIStreamChannels } from '@memoflow/contracts/electron';
import { fail, ok } from '@memoflow/contracts/result';
import { AIAssistantIpcAdapter } from './ai-assistant-ipc.adapter';

function createBridgeHarness() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const bridge = {
    on: vi.fn((channel: string, handler: (...args: unknown[]) => void) => {
      const set = listeners.get(channel) ?? new Set();
      set.add(handler);
      listeners.set(channel, set);
    }),
    off: vi.fn((channel: string, handler: (...args: unknown[]) => void) => {
      listeners.get(channel)?.delete(handler);
    }),
  };
  const emit = (channel: string, payload: unknown) => {
    for (const handler of listeners.get(channel) ?? []) {
      handler(payload);
    }
  };
  return { bridge, emit, listeners };
}


describe('AIAssistantIpcAdapter', () => {
  it('streams assistant events over Desktop IPC and never sends identityId', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const invoke = vi.fn(
      async (channel: string, payload: { streamId: string; command: unknown }) => {
        if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
          expect(JSON.stringify(payload.command)).not.toContain('identityId');
          void Promise.resolve().then(() => {
            emit(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
              streamId: payload.streamId,
              event: {
                type: 'run.started',
                runId: 'run-1',
                engineId: 'engine.direct_turn',
                profile: 'direct_turn',
              },
            });
            emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
              streamId: payload.streamId,
              result: { eventCount: 1 },
            });
          });
          return ok(null);
        }
        return ok(null);
      },
    );

    const adapter = new AIAssistantIpcAdapter({
      invoke,
      getBridge: () => b,
    } as never);

    const events: unknown[] = [];
    let done: { eventCount: number } | undefined;
    await adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'conv-1',
        content: 'hi',
        surface: 'desktop',
      },
      {
        onEvent: (event) => events.push(event),
        onDone: (result) => {
          done = result;
        },
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      AIChannels.ASSISTANT_DISPATCH_START,
      expect.objectContaining({
        command: {
          type: 'message',
          conversationId: 'conv-1',
          content: 'hi',
          surface: 'desktop',
        },
      }),
    );
    expect(events).toEqual([
      {
        type: 'run.started',
        runId: 'run-1',
        engineId: 'engine.direct_turn',
        profile: 'direct_turn',
      },
    ]);
    expect(done).toEqual({ eventCount: 1 });
  });

  it('rejects smuggled identityId and fail-closes with ASSISTANT_DISPATCH_UNAVAILABLE without bridge', async () => {
    const adapter = new AIAssistantIpcAdapter({ invoke: vi.fn() } as never);
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'cancel_run',
          runId: 'r1',
          identityId: 'attacker',
        } as never,
        {},
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'ASSISTANT_DISPATCH_UNAVAILABLE' });
  });

  it('normalizes a START rejection NOT_SUPPORTED/NOT_FOUND to dispatch unavailable', async () => {
    const { bridge: b } = createBridgeHarness();
    for (const code of ['NOT_SUPPORTED', 'NOT_FOUND']) {
      const adapter = new AIAssistantIpcAdapter({
        invoke: vi.fn(async () => fail({ code, message: 'no handler' })),
        getBridge: () => b,
      } as never);
      await expect(
        adapter.dispatchAssistant(
          {
            type: 'message',
            conversationId: 'c1',
            content: 'hi',
            surface: 'desktop',
          },
          {},
        ),
      ).rejects.toMatchObject({ code: 'ASSISTANT_DISPATCH_UNAVAILABLE' });
    }
  });

  it('keeps a START rejection that is not a missing handler as its own code', async () => {
    const { bridge: b } = createBridgeHarness();
    const adapter = new AIAssistantIpcAdapter({
      invoke: vi.fn(async () => fail({ code: 'VALIDATION_ERROR', message: 'bad' })),
      getBridge: () => b,
    } as never);
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('isolates concurrent streams by streamId and ignores foreign payloads', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const streamIds: string[] = [];
    const invoke = vi.fn(
      async (channel: string, payload: { streamId: string }) => {
        if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
          streamIds.push(payload.streamId);
          const ownId = payload.streamId;
          const foreignId = `${ownId}-foreign`;
          void Promise.resolve().then(() => {
            emit(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
              streamId: foreignId,
              event: {
                type: 'message.delta',
                runId: 'other',
                content: 'should be ignored',
              },
            });
            emit(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
              streamId: ownId,
              event: {
                type: 'run.started',
                runId: 'run-a',
                engineId: 'engine.direct_turn',
                profile: 'direct_turn',
              },
            });
            emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
              streamId: ownId,
              result: { eventCount: 1 },
            });
          });
          return ok(null);
        }
        return ok(null);
      },
    );

    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    const first = adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'c-a',
        content: 'a',
        surface: 'desktop',
      },
      { onEvent: vi.fn() },
    );
    const second = adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'c-b',
        content: 'b',
        surface: 'desktop',
      },
      { onEvent: vi.fn() },
    );
    await Promise.all([first, second]);

    expect(streamIds).toHaveLength(2);
    expect(streamIds[0]).not.toBe(streamIds[1]);
  });

  it('treats a malformed event payload as a protocol error', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const invoke = vi.fn(async (channel: string, payload: { streamId: string }) => {
      if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
        void Promise.resolve().then(() => {
          emit(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
            streamId: payload.streamId,
            event: { type: 'run.started', runId: 'r1' },
          });
        });
        return ok(null);
      }
      return ok(null);
    });
    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'ASSISTANT_PROTOCOL_ERROR' });
  });

  it('treats a malformed done payload as a protocol error', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const invoke = vi.fn(async (channel: string, payload: { streamId: string }) => {
      if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
        void Promise.resolve().then(() => {
          emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
            streamId: payload.streamId,
            result: { eventCount: -1 },
          });
        });
        return ok(null);
      }
      return ok(null);
    });
    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'ASSISTANT_PROTOCOL_ERROR' });
  });

  it('settles once: a second done or error after the first is ignored and listeners are removed', async () => {
    const { bridge: b, emit, listeners } = createBridgeHarness();
    const invoke = vi.fn(async (channel: string, payload: { streamId: string }) => {
      if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
        void Promise.resolve().then(() => {
          emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
            streamId: payload.streamId,
            result: { eventCount: 1 },
          });
          emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
            streamId: payload.streamId,
            result: { eventCount: 999 },
          });
          emit(AIStreamChannels.ASSISTANT_DISPATCH_ERROR, {
            streamId: payload.streamId,
            code: 'INTERNAL_ERROR',
            message: 'second',
          });
        });
        return ok(null);
      }
      return ok(null);
    });
    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    const onDone = vi.fn();
    const onEvent = vi.fn();

    await adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'c1',
        content: 'hi',
        surface: 'desktop',
      },
      { onDone, onEvent },
    );

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith({ eventCount: 1 });
    // After settlement, all listeners are removed so nothing leaks.
    expect(listeners.get(AIStreamChannels.ASSISTANT_DISPATCH_EVENT)?.size ?? 0).toBe(0);
    expect(listeners.get(AIStreamChannels.ASSISTANT_DISPATCH_DONE)?.size ?? 0).toBe(0);
    expect(listeners.get(AIStreamChannels.ASSISTANT_DISPATCH_ERROR)?.size ?? 0).toBe(0);
  });

  it('aborts before start: rejects with ABORTED and never invokes START', async () => {
    const { bridge: b } = createBridgeHarness();
    const invoke = vi.fn(async () => ok(null));
    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    const controller = new AbortController();
    controller.abort();

    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
        controller.signal,
      ),
    ).rejects.toMatchObject({ code: 'ABORTED' });
    expect(invoke).not.toHaveBeenCalledWith(AIChannels.ASSISTANT_DISPATCH_START, expect.anything());
  });

  it('aborts after start: invokes CANCEL and rejects with ABORTED', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const invoke = vi.fn(async (channel: string) => {
      if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
        return ok(null);
      }
      return ok(null);
    });
    const adapter = new AIAssistantIpcAdapter({ invoke, getBridge: () => b } as never);
    const controller = new AbortController();

    const promise = adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'c1',
        content: 'hi',
        surface: 'desktop',
      },
      {},
      controller.signal,
    );

    await vi.waitFor(() => expect(invoke).toHaveBeenCalledWith(AIChannels.ASSISTANT_DISPATCH_START, expect.anything()));
    controller.abort();
    await expect(promise).rejects.toMatchObject({ code: 'ABORTED' });
    expect(invoke).toHaveBeenCalledWith(AIChannels.ASSISTANT_DISPATCH_CANCEL, expect.any(String));
  });

  it('forwards executionProfileId pi_readonly without identityId (residual 377)', async () => {
    const { bridge: b, emit } = createBridgeHarness();
    const invoke = vi.fn(
      async (channel: string, payload: { streamId: string; command: unknown }) => {
        if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
          expect(payload.command).toMatchObject({
            type: 'message',
            conversationId: 'conv-ro',
            content: 'analyze',
            surface: 'desktop',
            executionProfileId: 'pi_readonly',
          });
          expect(JSON.stringify(payload.command)).not.toContain('identityId');
          void Promise.resolve().then(() => {
            emit(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
              streamId: payload.streamId,
              event: {
                type: 'run.started',
                runId: 'run-ro',
                engineId: 'engine.pi_readonly',
                profile: 'pi_readonly',
              },
            });
            emit(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
              streamId: payload.streamId,
              result: { eventCount: 1 },
            });
          });
          return ok(null);
        }
        return ok(null);
      },
    );

    const adapter = new AIAssistantIpcAdapter({
      invoke,
      getBridge: () => b,
    } as never);

    const events: unknown[] = [];
    let done: { eventCount: number } | undefined;
    await adapter.dispatchAssistant(
      {
        type: 'message',
        conversationId: 'conv-ro',
        content: 'analyze',
        surface: 'desktop',
        executionProfileId: 'pi_readonly',
      },
      {
        onEvent: (event) => events.push(event),
        onDone: (result) => {
          done = result;
        },
      },
    );

    expect(invoke).toHaveBeenCalledWith(
      AIChannels.ASSISTANT_DISPATCH_START,
      expect.objectContaining({
        command: {
          type: 'message',
          conversationId: 'conv-ro',
          content: 'analyze',
          surface: 'desktop',
          executionProfileId: 'pi_readonly',
        },
      }),
    );
    expect(events).toEqual([
      {
        type: 'run.started',
        runId: 'run-ro',
        engineId: 'engine.pi_readonly',
        profile: 'pi_readonly',
      },
    ]);
    expect(done).toEqual({ eventCount: 1 });
  });

});
