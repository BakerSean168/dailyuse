import { describe, expect, it, vi } from 'vitest';
import { dispatchHostProposalDecision } from './hostProposalLifecycle';

describe('dispatchHostProposalDecision', () => {
  it('approves via approve_proposal without identityId or executeApproved', async () => {
    const dispatchAssistant = vi.fn(async (command, handlers) => {
      handlers.onEvent?.({
        type: 'proposal.approved',
        runId: command.runId,
        proposalId: command.proposalId,
        revision: command.revision,
      });
    });

    const events = await dispatchHostProposalDecision(
      { dispatchAssistant },
      { decision: 'approve', runId: 'run-1', kind: 'goal.create' },
    );

    expect(dispatchAssistant).toHaveBeenCalledOnce();
    expect(dispatchAssistant.mock.calls[0][0]).toEqual({
      type: 'approve_proposal',
      runId: 'run-1',
      proposalId: 'agent-run:run-1:goal.create',
      revision: 1,
    });
    expect(dispatchAssistant.mock.calls[0][0]).not.toHaveProperty('identityId');
    expect(events[0]).toMatchObject({ type: 'proposal.approved' });
  });

  it('rejects via reject_proposal and fails closed without lifecycle event', async () => {
    const dispatchAssistant = vi.fn(async (command, handlers) => {
      handlers.onEvent?.({
        type: 'proposal.rejected',
        runId: command.runId,
        proposalId: command.proposalId,
        revision: command.revision,
        reason: command.reason,
      });
    });

    await dispatchHostProposalDecision(
      { dispatchAssistant },
      {
        decision: 'reject',
        runId: 'run-k',
        kind: 'knowledge.write',
        reason: 'user_cancel',
      },
    );

    expect(dispatchAssistant.mock.calls[0][0]).toEqual({
      type: 'reject_proposal',
      runId: 'run-k',
      proposalId: 'agent-run:run-k:knowledge.write',
      revision: 1,
      reason: 'user_cancel',
    });

    const silent = vi.fn(async () => undefined);
    await expect(
      dispatchHostProposalDecision(
        { dispatchAssistant: silent },
        { decision: 'approve', runId: 'run-x', kind: 'goal.create' },
      ),
    ).rejects.toThrow(/proposal.approved/);
  });
});
