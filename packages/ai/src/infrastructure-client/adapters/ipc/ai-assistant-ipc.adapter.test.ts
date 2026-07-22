import { describe, expect, it, vi } from 'vitest';
import { AIChannels, AIStreamChannels } from '@dailyuse/contracts/electron';
import { ok } from '@dailyuse/contracts/result';
import { AIAssistantIpcAdapter } from './ai-assistant-ipc.adapter';

describe('AIAssistantIpcAdapter', () => {
  it('streams assistant events over Desktop IPC and never sends identityId', async () => {
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
    const invoke = vi.fn(
      async (channel: string, payload: { streamId: string; command: unknown }) => {
        if (channel === AIChannels.ASSISTANT_DISPATCH_START) {
          expect(JSON.stringify(payload.command)).not.toContain('identityId');
          void Promise.resolve().then(() => {
            for (const handler of listeners.get(AIStreamChannels.ASSISTANT_DISPATCH_EVENT) ?? []) {
              handler({
                streamId: payload.streamId,
                event: {
                  type: 'run.started',
                  runId: 'run-1',
                  engineId: 'engine.direct_turn',
                  profile: 'direct_turn',
                },
              });
            }
            for (const handler of listeners.get(AIStreamChannels.ASSISTANT_DISPATCH_DONE) ?? []) {
              handler({ streamId: payload.streamId, result: { eventCount: 1 } });
            }
          });
          return ok(null);
        }
        return ok(null);
      },
    );

    const adapter = new AIAssistantIpcAdapter({
      invoke,
      getBridge: () => bridge,
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

  it('rejects smuggled identityId and fail-closes without bridge', async () => {
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
    ).rejects.toMatchObject({ code: 'NOT_SUPPORTED' });
  });
});
