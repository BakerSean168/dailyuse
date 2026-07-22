import { describe, expect, it, vi } from 'vitest';
import {
  applyHostGoalPatchToAgentActions,
  applyHostKnowledgePatchToAgentActions,
  buildHostExecutionReceiptItems,
  resolveHostWorkbenchReopenFromAgentRun,
  shouldOpenHostWorkbenchFromAgentRun,
  buildHostProposalPatchFromDraft,
  buildPendingHostProposalItems,
  dispatchHostProposalDecision,
  dispatchHostProposalRevise,
  getRememberedHostProposalRevision,
  isHostProposalDraftDirty,
} from './hostProposalLifecycle';
import type { AgentAction } from '@dailyuse/contracts/ai';
import type { AgentRunResult } from '@dailyuse/contracts/ai';

function goalWaitingRun(status: AgentRunResult['run']['status'] = 'waiting_approval'): AgentRunResult {
  return {
    run: {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: 'conv-1',
      identityId: 'id-1',
      agentType: 'goal.create',
      status,
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'goal-create',
      stage: 'approval',
      artifacts: [
        {
          artifactId: 'a1',
          kind: 'goal_draft',
          title: 'Ship Host Panel',
          data: { description: 'Initial goal description' },
          updatedAt: 2,
        },
      ],
      citations: [],
      retrievedContext: [],
      pendingActions: [
        {
          tool: 'create_goal',
          payload: { title: 'Ship Host Panel', description: 'Initial goal description' },
          rationale: 'Create the approved goal draft after user confirmation.',
          index: 0,
          dependsOn: [],
        },
      ],
      approvedActions: [],
      executedActions: [],
      usage: {},
      errors: [],
    },
    events: [],
    interrupts: [],
  } as AgentRunResult;
}

function noteWaitingRun(status: AgentRunResult['run']['status'] = 'waiting_approval'): AgentRunResult {
  return {
    run: {
      runId: 'note-run-1',
      threadId: 'note-thread-1',
      conversationId: 'conv-1',
      identityId: 'id-1',
      agentType: 'knowledge.generate',
      status,
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'knowledge-generate',
      stage: 'approval',
      artifacts: [
        {
          artifactId: 'n1',
          kind: 'knowledge_note_draft',
          title: 'AI Note Draft',
          data: { title: 'AI Note Draft', markdown: '# body', targetSubpath: 'notes/ai' },
          updatedAt: 2,
        },
      ],
      citations: [],
      retrievedContext: [],
      pendingActions: [
        {
          tool: 'create_knowledge_note',
          payload: {},
          rationale: 'Persist the approved knowledge note draft.',
          index: 0,
          dependsOn: [],
        },
      ],
      approvedActions: [],
      executedActions: [],
      usage: {},
      errors: [],
    },
    events: [],
    interrupts: [],
  } as AgentRunResult;
}

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

describe('buildPendingHostProposalItems (residual 357)', () => {
  it('lists only waiting_approval goal/knowledge bridge proposals', () => {
    const items = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_approval'),
      noteAgentRun: noteWaitingRun('waiting_approval'),
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      source: 'goal',
      kind: 'goal.create',
      proposalId: 'agent-run:run-1:goal.create',
      revision: 1,
      title: 'Ship Host Panel',
      description: 'Initial goal description',
      pendingActionCount: 1,
    });
    expect(items[1]).toMatchObject({
      source: 'knowledge',
      kind: 'knowledge.write',
      proposalId: 'agent-run:note-run-1:knowledge.write',
      title: 'AI Note Draft',
      targetPath: 'notes/ai',
      contentMarkdown: '# body',
    });
  });

  it('builds knowledge patch and detects path/content dirty state (residual 361)', () => {
    const items = buildPendingHostProposalItems({
      noteAgentRun: noteWaitingRun('waiting_approval'),
    });
    const item = items[0]!;
    expect(
      buildHostProposalPatchFromDraft({
        kind: 'knowledge.write',
        targetPath: ' notes/edited ',
        contentMarkdown: '# revised',
      }),
    ).toEqual({
      targetPath: 'notes/edited',
      contentMarkdown: '# revised',
    });
    expect(
      isHostProposalDraftDirty({
        item,
        targetPath: item.targetPath,
        contentMarkdown: item.contentMarkdown,
      }),
    ).toBe(false);
    expect(
      isHostProposalDraftDirty({
        item,
        targetPath: 'notes/edited',
        contentMarkdown: item.contentMarkdown,
      }),
    ).toBe(true);
  });

  it('builds goal patch and detects title/description dirty state (residual 367)', () => {
    const items = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_approval'),
    });
    const item = items[0]!;
    expect(
      buildHostProposalPatchFromDraft({
        kind: 'goal.create',
        title: ' Revised goal ',
        description: 'Edited description',
      }),
    ).toEqual({
      title: 'Revised goal',
      description: 'Edited description',
    });
    expect(
      isHostProposalDraftDirty({
        item,
        title: item.title,
        description: item.description,
      }),
    ).toBe(false);
    expect(
      isHostProposalDraftDirty({
        item,
        title: item.title,
        description: 'Edited description',
      }),
    ).toBe(true);
    expect(
      isHostProposalDraftDirty({
        item,
        title: 'Different title',
        description: item.description,
      }),
    ).toBe(true);
  });

  it('excludes waiting_execution and completed so continue/retry do not re-approve', () => {
    const items = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_execution'),
      noteAgentRun: noteWaitingRun('completed'),
    });
    expect(items).toEqual([]);
  });
});

describe('dispatchHostProposalRevise (residual 359)', () => {
  it('revises via revise_proposal and remembers the new revision', async () => {
    const dispatchAssistant = vi.fn(async (command, handlers) => {
      handlers.onEvent?.({
        type: 'proposal.revised',
        runId: command.runId,
        proposalId: command.proposalId,
        revision: command.revision + 1,
        kind: 'goal.create',
        title: command.patch?.title,
      });
    });

    const result = await dispatchHostProposalRevise(
      { dispatchAssistant },
      {
        runId: 'run-1',
        kind: 'goal.create',
        revision: 1,
        patch: { title: 'Edited' },
      },
    );

    expect(dispatchAssistant.mock.calls[0][0]).toEqual({
      type: 'revise_proposal',
      runId: 'run-1',
      proposalId: 'agent-run:run-1:goal.create',
      revision: 1,
      patch: { title: 'Edited' },
    });
    expect(result.revision).toBe(2);
    expect(getRememberedHostProposalRevision('agent-run:run-1:goal.create')).toBe(2);
  });
});

describe('applyHostKnowledgePatchToAgentActions (residual 363)', () => {
  it('overlays Host path/body onto create_knowledge_note executor actions only', () => {
    const actions = [
      {
        tool: 'create_knowledge_note',
        payload: {
          topic: 't',
          contentMarkdown: '# old',
          targetSubpath: 'notes/old',
        },
        rationale: 'save',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'search_knowledge',
        payload: { query: 'x' },
        rationale: 'search',
        index: 1,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostKnowledgePatchToAgentActions(actions, {
      targetPath: 'notes/edited',
      contentMarkdown: '# revised body',
    });

    expect(patched[0]).toMatchObject({
      tool: 'create_knowledge_note',
      payload: {
        topic: 't',
        targetSubpath: 'notes/edited',
        targetPath: 'notes/edited',
        contentMarkdown: '# revised body',
        markdown: '# revised body',
      },
    });
    expect(patched[1]).toMatchObject({
      tool: 'search_knowledge',
      payload: { query: 'x' },
    });
    // original actions remain untouched
    expect(actions[0]?.payload).toMatchObject({
      contentMarkdown: '# old',
      targetSubpath: 'notes/old',
    });
  });
});

describe('applyHostGoalPatchToAgentActions (residual 365)', () => {
  it('overlays Host title/description onto create_goal executor actions only', () => {
    const actions = [
      {
        tool: 'create_goal',
        payload: {
          title: 'old title',
          description: 'old description',
          category: 'health',
        },
        rationale: 'create',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_key_result',
        payload: { title: 'kr-1' },
        rationale: 'kr',
        index: 1,
        dependsOn: [0],
      },
    ] as AgentAction[];

    const patched = applyHostGoalPatchToAgentActions(actions, {
      title: 'Host revised title',
      description: 'Host revised description',
    });

    expect(patched[0]).toMatchObject({
      tool: 'create_goal',
      payload: {
        title: 'Host revised title',
        description: 'Host revised description',
        category: 'health',
      },
    });
    expect(patched[1]).toMatchObject({
      tool: 'create_key_result',
      payload: { title: 'kr-1' },
    });
    // original actions remain untouched
    expect(actions[0]?.payload).toMatchObject({
      title: 'old title',
      description: 'old description',
    });
  });

  it('leaves create_goal payload when Host patch is empty', () => {
    const actions = [
      {
        tool: 'create_goal',
        payload: { title: 'keep me' },
        rationale: 'create',
        index: 0,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostGoalPatchToAgentActions(actions, {});
    expect(patched[0]?.payload).toMatchObject({ title: 'keep me' });
    expect(patched[0]?.payload).not.toBe(actions[0]?.payload);
  });
});

describe('buildHostExecutionReceiptItems (residual 379)', () => {
  function goalCompletedRun(): AgentRunResult {
    const run = goalWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.approvedActions = [
      {
        tool: 'create_goal',
        payload: { title: 'Ship Host Panel', description: 'Initial goal description' },
        rationale: 'Create the approved goal draft after user confirmation.',
        index: 0,
        dependsOn: [],
      },
    ];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'created',
      },
      {
        tool: 'create_key_result',
        status: 'skipped',
        message: 'skipped',
      },
    ];
    return run;
  }

  function noteFailedRun(): AgentRunResult {
    const run = noteWaitingRun('failed');
    run.state.pendingActions = [];
    run.state.approvedActions = [
      {
        tool: 'create_knowledge_note',
        payload: { targetSubpath: 'notes/ai', contentMarkdown: '# body' },
        rationale: 'Persist the approved knowledge note draft.',
        index: 0,
        dependsOn: [],
      },
    ];
    run.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'failed',
        message: 'write denied',
      },
    ];
    run.state.errors = ['write denied'];
    return run;
  }

  it('lists completed/failed Host execution receipts with counts and entity ids', () => {
    const items = buildHostExecutionReceiptItems({
      goalAgentRun: goalCompletedRun(),
      noteAgentRun: noteFailedRun(),
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      source: 'goal',
      kind: 'goal.create',
      runStatus: 'completed',
      ok: true,
      title: 'Ship Host Panel',
      executedCount: 1,
      skippedCount: 1,
      failedCount: 0,
      entityIds: ['goal-1'],
      receiptKey: 'host-receipt:agent-run:run-1:goal.create',
    });
    expect(items[1]).toMatchObject({
      source: 'knowledge',
      kind: 'knowledge.write',
      runStatus: 'failed',
      ok: false,
      title: 'AI Note Draft',
      executedCount: 0,
      failedCount: 1,
    });
    expect(items[1]!.summary).toContain('write denied');
  });

  it('excludes waiting_approval and waiting_execution (no receipt yet)', () => {
    expect(
      buildHostExecutionReceiptItems({
        goalAgentRun: goalWaitingRun('waiting_approval'),
        noteAgentRun: noteWaitingRun('waiting_execution'),
      }),
    ).toEqual([]);
  });

  it('includes cancelled terminal runs even without executed actions', () => {
    const items = buildHostExecutionReceiptItems({
      goalAgentRun: goalWaitingRun('cancelled'),
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      runStatus: 'cancelled',
      ok: false,
      kind: 'goal.create',
    });
  });
});

describe('resolveHostWorkbenchReopenFromAgentRun (residual 381)', () => {
  it('reopens proposal workbench for waiting_approval goal/knowledge runs', () => {
    expect(resolveHostWorkbenchReopenFromAgentRun(goalWaitingRun('waiting_approval'))).toBe(
      'proposal',
    );
    expect(resolveHostWorkbenchReopenFromAgentRun(noteWaitingRun('waiting_approval'))).toBe(
      'proposal',
    );
    expect(shouldOpenHostWorkbenchFromAgentRun(goalWaitingRun('waiting_approval'))).toBe(true);
  });

  it('reopens receipt workbench for terminal Host runs with execution outcomes', () => {
    const completed = goalWaitingRun('completed');
    completed.state.pendingActions = [];
    completed.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-1',
        message: 'created',
      },
    ];
    expect(resolveHostWorkbenchReopenFromAgentRun(completed)).toBe('receipt');
    expect(shouldOpenHostWorkbenchFromAgentRun(completed)).toBe(true);
  });

  it('does not open Host workbench for knowledge.qa or mid-execution without Host rows', () => {
    const qa = goalWaitingRun('completed');
    qa.run.agentType = 'knowledge.qa';
    expect(resolveHostWorkbenchReopenFromAgentRun(qa)).toBe('none');
    expect(resolveHostWorkbenchReopenFromAgentRun(goalWaitingRun('waiting_execution'))).toBe(
      'none',
    );
    expect(shouldOpenHostWorkbenchFromAgentRun(null)).toBe(false);
  });
});

