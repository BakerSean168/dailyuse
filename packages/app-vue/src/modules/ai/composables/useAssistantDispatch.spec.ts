import { describe, expect, it, vi } from 'vitest';
import type { AssistantEvent } from '@memoflow/contracts/ai';
import { useAssistantDispatch } from './useAssistantDispatch';

describe('useAssistantDispatch', () => {
  it('dispatches message without identityId and collects Host events', async () => {
    const events: AssistantEvent[] = [
      {
        type: 'run.started',
        runId: 'run-1',
        engineId: 'engine.direct_turn',
        profile: 'direct_turn',
      },
      {
        type: 'message.completed',
        runId: 'run-1',
        status: 'completed',
        content: 'ok',
      },
    ];
    const dispatchAssistant = vi.fn(async (_command, handlers) => {
      for (const event of events) {
        handlers.onEvent?.(event);
      }
    });
    const { dispatchMessage, lastEvents, dispatching } = useAssistantDispatch({
      service: { dispatchAssistant },
    });

    expect(dispatching.value).toBe(false);
    const collected = await dispatchMessage({
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'web',
    });

    expect(dispatchAssistant).toHaveBeenCalledOnce();
    const command = dispatchAssistant.mock.calls[0][0];
    expect(command).toEqual({
      type: 'message',
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'web',
      runId: undefined,
      executionProfileId: undefined,
      providerId: undefined,
      model: undefined,
    });
    expect(command).not.toHaveProperty('identityId');
    expect(collected).toEqual(events);
    expect(lastEvents.value).toEqual(events);
    expect(dispatching.value).toBe(false);
  });

  it('rejects smuggled identityId and routes approve without mutation executor', async () => {
    const dispatchAssistant = vi.fn(async (_command, handlers) => {
      handlers.onEvent?.({
        type: 'proposal.approved',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 1,
      });
    });
    const api = useAssistantDispatch({ service: { dispatchAssistant } });

    await expect(
      api.dispatch({
        type: 'cancel_run',
        runId: 'r1',
        identityId: 'attacker',
      } as never),
    ).rejects.toThrow(/identityId/);
    expect(dispatchAssistant).not.toHaveBeenCalled();

    const approved = await api.approveProposal({
      runId: 'run-p',
      proposalId: 'prop-1',
      revision: 1,
    });
    expect(approved[0]).toMatchObject({ type: 'proposal.approved', proposalId: 'prop-1' });
    expect(dispatchAssistant.mock.calls[0][0]).toEqual({
      type: 'approve_proposal',
      runId: 'run-p',
      proposalId: 'prop-1',
      revision: 1,
    });
  });

  it.each([
    { surface: 'web', label: 'web' },
    { surface: 'desktop', label: 'desktop' },
  ] as const)(
    'carries the explicit $label surface on the command (no window sniffing)',
    async ({ surface }) => {
      const dispatchAssistant = vi.fn(async () => {});
      const api = useAssistantDispatch({ service: { dispatchAssistant } });

      await api.dispatchMessage({
        conversationId: 'conv-1',
        content: 'hello',
        surface,
        runId: 'run-1',
        executionProfileId: 'direct_turn',
        providerId: 'provider-1',
        model: 'model-1',
      });

      expect(dispatchAssistant.mock.calls[0][0]).toMatchObject({
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface,
        runId: 'run-1',
        executionProfileId: 'direct_turn',
        providerId: 'provider-1',
        model: 'model-1',
      });
    },
  );

  it('resets dispatch state after a failed dispatch and never leaves lastEvents generating', async () => {
    const dispatchAssistant = vi.fn(async () => {
      throw new Error('boom');
    });
    const api = useAssistantDispatch({ service: { dispatchAssistant } });

    await expect(
      api.dispatchMessage({ conversationId: 'c', content: 'x', surface: 'web' }),
    ).rejects.toThrow('boom');
    expect(api.dispatching.value).toBe(false);
    expect(api.lastError.value).toBe('boom');
    expect(api.lastEvents.value).toEqual([]);
  });

  it('aborts an active dispatch via its own controller and via an external signal', async () => {
    let capturedSignal: AbortSignal | undefined;
    const dispatchAssistant = vi.fn((_command, _handlers, signal) => {
      capturedSignal = signal;
      return new Promise<void>((_resolve, reject) => {
        const onAbort = () => reject(new Error('aborted'));
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    });
    const api = useAssistantDispatch({ service: { dispatchAssistant } });

    const run = api.dispatchMessage({
      conversationId: 'c',
      content: 'x',
      surface: 'desktop',
    });
    await Promise.resolve();
    expect(capturedSignal?.aborted).toBe(false);
    api.abortActiveDispatch();
    await expect(run).rejects.toThrow();
    expect(api.dispatching.value).toBe(false);
  });

  it('propagates an external abort signal into the service call', async () => {
    let capturedSignal: AbortSignal | undefined;
    const pending = new Promise<void>(() => {});
    const dispatchAssistant = vi.fn((_command, _handlers, signal) => {
      capturedSignal = signal;
      return new Promise<void>((resolve, reject) => {
        const onAbort = () => reject(new Error('aborted'));
        signal?.addEventListener('abort', onAbort, { once: true });
        pending.then(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        });
      });
    });
    const api = useAssistantDispatch({ service: { dispatchAssistant } });
    const external = new AbortController();

    const run = api.dispatchMessage({
      conversationId: 'c',
      content: 'x',
      surface: 'web',
      signal: external.signal,
    });
    await Promise.resolve();
    external.abort();
    await expect(run).rejects.toThrow();
    expect(capturedSignal?.aborted).toBe(true);
    expect(api.dispatching.value).toBe(false);
  });
});
