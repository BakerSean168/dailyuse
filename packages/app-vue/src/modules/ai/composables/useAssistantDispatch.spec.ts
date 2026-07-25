import { describe, expect, it, vi } from 'vitest';
import type { AssistantEvent } from '@dailyuse/contracts/ai';
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
});
