import { describe, expect, it, vi } from 'vitest';
import {
  applyHostGoalPatchToAgentActions,
  applyHostKnowledgePatchToAgentActions,
  buildHostExecutionReceiptItems,
  buildHostTimelineArtifactItems,
  resolveHostWorkbenchFocusFromTimeline,
  normalizeHostProposalRejectReason,
  resolveHostTimelineEngineKey,
  buildHostOpenChatTimelineArtifactItems,
  resolveHostWorkbenchReopenFromAgentRun,
  shouldOpenHostWorkbenchFromAgentRun,
  buildHostProposalPatchFromDraft,
  buildPendingHostProposalItems,
  dispatchHostProposalDecision,
  dispatchHostProposalRevise,
  getRememberedHostProposalRevision,
  isHostProposalDraftDirty,
  partitionHostTimelineArtifactsBySurface,
  collectHostTimelineSurfaceIsolationViolations,
  composeHostWorkbenchTimelineArtifacts
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

    const freeformDispatch = vi.fn(async (command, handlers) => {
      handlers.onEvent?.({
        type: 'proposal.rejected',
        runId: command.runId,
        proposalId: command.proposalId,
        revision: command.revision,
        reason: command.reason,
      });
    });
    await dispatchHostProposalDecision(
      { dispatchAssistant: freeformDispatch },
      {
        decision: 'reject',
        runId: 'run-free',
        kind: 'goal.create',
        reason: normalizeHostProposalRejectReason('  vault path invalid  '),
      },
    );
    expect(freeformDispatch.mock.calls[0][0]).toMatchObject({
      type: 'reject_proposal',
      runId: 'run-free',
      reason: 'vault path invalid',
    });
    expect(freeformDispatch.mock.calls[0][0]).not.toHaveProperty('identityId');

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
      description: 'Initial goal description',
      executedCount: 1,
      skippedCount: 1,
      failedCount: 0,
      entityIds: ['goal-1'],
      primaryEntityId: 'goal-1',
      receiptKey: 'host-receipt:agent-run:run-1:goal.create',
    });
    expect(items[0]!.actionLines).toEqual([
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'created',
        entityId: 'goal-1',
      },
      {
        tool: 'create_key_result',
        status: 'skipped',
        message: 'skipped',
      },
    ]);
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

describe('buildHostTimelineArtifactItems (residual 383)', () => {
  it('maps pending proposals and terminal receipts into timeline Artifact cards', () => {
    const proposals = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_approval'),
    });
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
    // Note: proposal + receipt for same kind may coexist only across different runs;
    // here we combine goal proposal with a note receipt for two cards.
    const noteCompleted = noteWaitingRun('completed');
    noteCompleted.state.pendingActions = [];
    noteCompleted.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        entityId: 'note-1',
        message: 'created',
      },
    ];
    const receipts = buildHostExecutionReceiptItems({
      noteAgentRun: noteCompleted,
    });
    const items = buildHostTimelineArtifactItems({ proposals, receipts });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      surface: 'proposal',
      statusLabelKey: 'pending',
      kind: 'goal.create',
      title: 'Ship Host Panel',
    });
    expect(items[1]).toMatchObject({
      surface: 'receipt',
      statusLabelKey: 'ok',
      kind: 'knowledge.write',
      title: 'AI Note Draft',
    });
  });

  it('returns empty when Host has no proposal or receipt rows', () => {
    expect(buildHostTimelineArtifactItems({})).toEqual([]);
  });
});

describe('buildHostExecutionReceiptItems rich replay (residual 385)', () => {
  it('includes knowledge path, body preview, action lines, and primary entity', () => {
    const run = noteWaitingRun('completed');
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
        status: 'executed',
        entityId: 'note-42',
        message: 'note created',
      },
    ];
    const items = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'knowledge.write',
      targetPath: 'notes/ai',
      contentPreview: '# body',
      primaryEntityId: 'note-42',
      actionLines: [
        {
          tool: 'create_knowledge_note',
          status: 'executed',
          message: 'note created',
          entityId: 'note-42',
        },
      ],
    });
  });

  it('truncates long knowledge body previews for receipt replay', () => {
    const run = noteWaitingRun('completed');
    const longBody = 'x'.repeat(300);
    run.state.artifacts = [
      {
        artifactId: 'n1',
        kind: 'knowledge_note_draft',
        title: 'AI Note Draft',
        data: { title: 'AI Note Draft', markdown: longBody, targetSubpath: 'notes/long' },
        updatedAt: 2,
      },
    ];
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        entityId: 'note-long',
        message: 'ok',
      },
    ];
    const items = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(items[0]!.contentPreview).toBe(`${'x'.repeat(240)}…`);
    expect(items[0]!.targetPath).toBe('notes/long');
  });
});

describe('resolveHostWorkbenchFocusFromTimeline (residual 387)', () => {
  it('maps timeline proposal/receipt cards to workbench focus targets', () => {
    const proposals = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_approval'),
    });
    const cards = buildHostTimelineArtifactItems({ proposals });
    expect(resolveHostWorkbenchFocusFromTimeline(cards[0])).toEqual({
      proposalId: 'agent-run:run-1:goal.create',
      surface: 'proposal',
    });

    const completed = noteWaitingRun('completed');
    completed.state.pendingActions = [];
    completed.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        entityId: 'note-1',
        message: 'ok',
      },
    ];
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: completed });
    const receiptCards = buildHostTimelineArtifactItems({ receipts });
    expect(resolveHostWorkbenchFocusFromTimeline(receiptCards[0])).toEqual({
      proposalId: 'agent-run:note-run-1:knowledge.write',
      surface: 'receipt',
    });
  });

  it('returns null for missing or empty timeline items', () => {
    expect(resolveHostWorkbenchFocusFromTimeline(null)).toBeNull();
    expect(resolveHostWorkbenchFocusFromTimeline(undefined)).toBeNull();
    expect(
      resolveHostWorkbenchFocusFromTimeline({
        id: 'x',
        surface: 'proposal',
        runId: 'r',
        proposalId: '   ',
        kind: 'goal.create',
        source: 'goal',
        title: 't',
        summary: '',
        statusLabelKey: 'pending',
      }),
    ).toBeNull();
  });
});

describe('Host workbench composition journey (residual 389)', () => {
  it('chains proposal → timeline → focus for waiting_approval Host rows', () => {
    const proposals = buildPendingHostProposalItems({
      goalAgentRun: goalWaitingRun('waiting_approval'),
      noteAgentRun: noteWaitingRun('waiting_approval'),
    });
    expect(proposals).toHaveLength(2);
    const cards = buildHostTimelineArtifactItems({ proposals });
    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.surface)).toEqual(['proposal', 'proposal']);
    expect(resolveHostWorkbenchFocusFromTimeline(cards[0])).toEqual({
      proposalId: proposals[0]!.proposalId,
      surface: 'proposal',
    });
    expect(resolveHostWorkbenchFocusFromTimeline(cards[1])).toEqual({
      proposalId: proposals[1]!.proposalId,
      surface: 'proposal',
    });
  });

  it('chains receipt rich replay → timeline → focus after terminal Host execution', () => {
    const completed = goalWaitingRun('completed');
    completed.state.pendingActions = [];
    completed.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        entityId: 'goal-99',
        message: 'created',
      },
    ];
    const noteDone = noteWaitingRun('completed');
    noteDone.state.pendingActions = [];
    noteDone.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        entityId: 'note-99',
        message: 'created',
      },
    ];
    const receipts = buildHostExecutionReceiptItems({
      goalAgentRun: completed,
      noteAgentRun: noteDone,
    });
    expect(receipts).toHaveLength(2);
    expect(receipts[0]).toMatchObject({
      primaryEntityId: 'goal-99',
      description: 'Initial goal description',
    });
    expect(receipts[1]).toMatchObject({
      primaryEntityId: 'note-99',
      targetPath: 'notes/ai',
      contentPreview: '# body',
    });
    const cards = buildHostTimelineArtifactItems({ receipts });
    expect(cards).toHaveLength(2);
    expect(cards.every((card) => card.surface === 'receipt')).toBe(true);
    expect(resolveHostWorkbenchFocusFromTimeline(cards[0])?.proposalId).toBe(
      receipts[0]!.proposalId,
    );
    expect(resolveHostWorkbenchFocusFromTimeline(cards[1])?.proposalId).toBe(
      receipts[1]!.proposalId,
    );
  });
});

describe('normalizeHostProposalRejectReason (residual 397)', () => {
  it('falls back to user_cancel for empty/whitespace and scrubs control chars', () => {
    expect(normalizeHostProposalRejectReason(undefined)).toBe('user_cancel');
    expect(normalizeHostProposalRejectReason(null)).toBe('user_cancel');
    expect(normalizeHostProposalRejectReason('')).toBe('user_cancel');
    expect(normalizeHostProposalRejectReason('   ')).toBe('user_cancel');
    expect(normalizeHostProposalRejectReason('\u0000bad\u0007 reason')).toBe('bad reason');
  });

  it('trims and caps freeform reason at 500 chars without identity smuggling fields', () => {
    const long = `  ${'x'.repeat(600)}  `;
    const normalized = normalizeHostProposalRejectReason(long);
    expect(normalized).toHaveLength(500);
    expect(normalized).toBe('x'.repeat(500));
    expect(normalizeHostProposalRejectReason('  path looks wrong  ')).toBe('path looks wrong');
  });
});

describe('resolveHostTimelineEngineKey (residual 399)', () => {
  it('maps AgentRun Host kinds to agent_run lanes ahead of open-chat profile', () => {
    expect(resolveHostTimelineEngineKey({ kind: 'goal.create' })).toBe('agent_run.goal_create');
    expect(resolveHostTimelineEngineKey({ kind: 'knowledge.write' })).toBe(
      'agent_run.knowledge_write',
    );
    expect(resolveHostTimelineEngineKey({ kind: 'task.create' })).toBe('agent_run.task_create');
    // AgentRun kind wins over open-chat profile — multi-engine isolation.
    expect(
      resolveHostTimelineEngineKey({
        kind: 'goal.create',
        executionProfileId: 'pi_readonly',
      }),
    ).toBe('agent_run.goal_create');
  });

  it('maps open-chat profiles when no AgentRun kind is present and fails closed', () => {
    expect(resolveHostTimelineEngineKey({ executionProfileId: 'direct_turn' })).toBe(
      'engine.direct_turn',
    );
    expect(resolveHostTimelineEngineKey({ executionProfileId: 'pi_readonly' })).toBe(
      'engine.pi_readonly',
    );
    expect(resolveHostTimelineEngineKey({})).toBe('unknown');
    expect(resolveHostTimelineEngineKey({ kind: 'mystery', executionProfileId: 'x' })).toBe(
      'unknown',
    );
  });

  it('attaches engineKey on timeline Artifact cards from proposal/receipt kinds', () => {
    const proposals = [
      {
        runId: 'run-g',
        proposalId: 'agent-run:run-g:goal.create',
        revision: 1,
        kind: 'goal.create' as const,
        source: 'goal' as const,
        runStatus: 'waiting_approval' as const,
        title: 'G',
        summary: 's',
        pendingActionCount: 1,
      },
    ];
    const cards = buildHostTimelineArtifactItems({ proposals });
    expect(cards[0]?.engineKey).toBe('agent_run.goal_create');

    const openChatOnly = buildHostTimelineArtifactItems({
      proposals: [],
      executionProfileId: 'pi_readonly',
    });
    expect(openChatOnly).toEqual([]);
  });
});

describe('buildHostOpenChatTimelineArtifactItems (residual 401)', () => {
  it('builds open-chat cards with live engine profile badges', () => {
    const items = buildHostOpenChatTimelineArtifactItems([
      {
        runId: 'open-chat:1',
        executionProfileId: 'direct_turn',
        status: 'completed',
        title: 'Hello engine',
        summary: 'reply',
        engineId: 'engine.direct_turn',
      },
      {
        runId: 'open-chat:2',
        executionProfileId: 'pi_readonly',
        status: 'generating',
        title: 'Analyze only',
      },
      {
        runId: '  ',
        executionProfileId: 'direct_turn',
        status: 'failed',
        title: 'skip empty run',
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      surface: 'open_chat',
      kind: 'open_chat.turn',
      source: 'open_chat',
      runId: 'open-chat:1',
      proposalId: 'open-chat:open-chat:1',
      engineKey: 'engine.direct_turn',
      statusLabelKey: 'ok',
      title: 'Hello engine',
    });
    expect(items[1]).toMatchObject({
      runId: 'open-chat:2',
      engineKey: 'engine.pi_readonly',
      statusLabelKey: 'pending',
    });
  });

  it('does not focus workbench rows for open_chat cards', () => {
    const [card] = buildHostOpenChatTimelineArtifactItems([
      {
        runId: 'run-x',
        executionProfileId: 'pi_readonly',
        status: 'aborted',
        title: 'stopped',
      },
    ]);
    expect(card?.statusLabelKey).toBe('cancelled');
    expect(resolveHostWorkbenchFocusFromTimeline(card)).toBeNull();
  });
});

describe('Host timeline surface isolation (residual 409)', () => {
  it('partitions open_chat vs AgentRun proposal/receipt lanes', () => {
    const openChat = buildHostOpenChatTimelineArtifactItems([
      {
        runId: 'oc-1',
        executionProfileId: 'direct_turn',
        status: 'completed',
        title: 'Open',
      },
    ]);
    const agentRun = buildHostTimelineArtifactItems({
      proposals: [
        {
          runId: 'run-g',
          proposalId: 'agent-run:run-g:goal.create',
          revision: 1,
          kind: 'goal.create',
          source: 'goal',
          runStatus: 'waiting_approval',
          title: 'Goal draft',
          summary: 's',
          pendingActionCount: 1,
        },
        {
          runId: 'run-k',
          proposalId: 'agent-run:run-k:knowledge.write',
          revision: 1,
          kind: 'knowledge.write',
          source: 'knowledge',
          runStatus: 'waiting_approval',
          title: 'Note draft',
          summary: 'n',
          pendingActionCount: 1,
        },
      ],
    });
    const mixed = [...openChat, ...agentRun];
    const parts = partitionHostTimelineArtifactsBySurface(mixed);
    expect(parts.openChat).toHaveLength(1);
    expect(parts.agentRun).toHaveLength(2);
    expect(parts.openChat[0]?.surface).toBe('open_chat');
    expect(parts.agentRun.every((item) => item.surface !== 'open_chat')).toBe(true);
  });

  it('reports zero violations for builders-composed multi-engine Host timeline', () => {
    const items = [
      ...buildHostOpenChatTimelineArtifactItems([
        {
          runId: 'oc-d',
          executionProfileId: 'direct_turn',
          status: 'completed',
          title: 'Direct',
        },
        {
          runId: 'oc-r',
          executionProfileId: 'pi_readonly',
          status: 'aborted',
          title: 'Readonly',
        },
      ]),
      ...buildHostTimelineArtifactItems({
        proposals: [
          {
            runId: 'run-g',
            proposalId: 'agent-run:run-g:goal.create',
            revision: 1,
            kind: 'goal.create',
            source: 'goal',
            runStatus: 'waiting_approval',
            title: 'Goal',
            summary: '',
            pendingActionCount: 1,
          },
        ],
        // Even if open-chat profile is present, AgentRun kind owns the engine lane.
        executionProfileId: 'pi_readonly',
      }),
    ];
    expect(collectHostTimelineSurfaceIsolationViolations(items)).toEqual([]);
  });

  it('flags open_chat cards smuggling agent_run engine keys or wrong kind', () => {
    const violations = collectHostTimelineSurfaceIsolationViolations([
      {
        id: 'bad-open',
        surface: 'open_chat',
        runId: 'x',
        proposalId: 'open-chat:x',
        kind: 'goal.create',
        source: 'open_chat',
        title: 'bad',
        summary: '',
        statusLabelKey: 'ok',
        engineKey: 'agent_run.goal_create',
      },
    ]);
    expect(violations.map((v) => v.code).sort()).toEqual([
      'open_chat_engine_agent_run',
      'open_chat_kind_mismatch',
    ]);
  });

  it('flags AgentRun cards smuggling open_chat kind or turn engine badges', () => {
    const violations = collectHostTimelineSurfaceIsolationViolations([
      {
        id: 'bad-proposal',
        surface: 'proposal',
        runId: 'y',
        proposalId: 'p',
        kind: 'open_chat.turn',
        source: 'goal',
        title: 'bad',
        summary: '',
        statusLabelKey: 'pending',
        engineKey: 'engine.direct_turn',
      },
    ]);
    expect(violations.map((v) => v.code).sort()).toEqual([
      'agent_run_engine_turn',
      'agent_run_kind_open_chat',
    ]);
  });
});

describe('composeHostWorkbenchTimelineArtifacts (residual 411)', () => {
  it('composes open-chat + AgentRun lanes with isolationOk', () => {
    const composition = composeHostWorkbenchTimelineArtifacts({
      openChatTurns: [
        {
          runId: 'oc-1',
          executionProfileId: 'direct_turn',
          status: 'completed',
          title: 'Hello',
        },
        {
          runId: 'oc-2',
          executionProfileId: 'pi_readonly',
          status: 'aborted',
          title: 'Readonly stop',
        },
      ],
      proposals: [
        {
          runId: 'run-g',
          proposalId: 'agent-run:run-g:goal.create',
          revision: 1,
          kind: 'goal.create',
          source: 'goal',
          runStatus: 'waiting_approval',
          title: 'Goal draft',
          summary: 's',
          pendingActionCount: 1,
        },
      ],
    });

    expect(composition.items).toHaveLength(3);
    expect(composition.openChat).toHaveLength(2);
    expect(composition.agentRun).toHaveLength(1);
    expect(composition.isolationOk).toBe(true);
    expect(composition.isolationViolations).toEqual([]);
    expect(composition.openChat.every((item) => item.surface === 'open_chat')).toBe(true);
    expect(composition.agentRun[0]?.engineKey).toBe('agent_run.goal_create');
    expect(composition.openChat.map((item) => item.engineKey).sort()).toEqual([
      'engine.direct_turn',
      'engine.pi_readonly',
    ]);
  });

  it('keeps empty composition isolationOk without claiming product E2E', () => {
    const composition = composeHostWorkbenchTimelineArtifacts({});
    expect(composition.items).toEqual([]);
    expect(composition.openChat).toEqual([]);
    expect(composition.agentRun).toEqual([]);
    expect(composition.isolationOk).toBe(true);
  });
});

function taskWaitingRun(): AgentRunResult {
  return {
    run: {
      runId: 'run-task-1',
      threadId: 'thread-task-1',
      conversationId: 'conv-task-1',
      identityId: 'id-1',
      agentType: 'goal.create',
      status: 'waiting_approval',
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      messages: [],
      intent: 'task-create',
      stage: 'approval',
      artifacts: [
        {
          kind: 'task_draft',
          title: 'Ship Host Task lane',
          data: { goalId: 'goal-1' },
        },
      ],
      pendingActions: [
        {
          tool: 'create_task_template',
          rationale: 'Create a follow-up task',
          payload: { title: 'Ship Host Task lane', goalId: 'goal-1' },
          dependsOn: [],
        },
      ],
      approvedActions: [],
      executedActions: [],
      errors: [],
      usage: {},
    },
  } as AgentRunResult;
}

describe('Host task.create proposal lane (residual 419)', () => {
  it('builds pending task Host proposal rows with title + goalId', () => {
    const items = buildPendingHostProposalItems({ taskAgentRun: taskWaitingRun() });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'task.create',
      source: 'task',
      runStatus: 'waiting_approval',
      title: 'Ship Host Task lane',
      goalId: 'goal-1',
      proposalId: 'agent-run:run-task-1:task.create',
    });
  });

  it('builds task Host execution receipts and reopens workbench for task-shaped runs', () => {
    const completed = taskWaitingRun();
    completed.run.status = 'completed';
    completed.state.pendingActions = [];
    completed.state.executedActions = [
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'task-1',
      },
    ] as any;

    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: completed });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({
      kind: 'task.create',
      source: 'task',
      title: 'Ship Host Task lane',
      primaryEntityId: 'task-1',
    });
    expect(resolveHostWorkbenchReopenFromAgentRun(completed)).toBe('receipt');
    expect(resolveHostWorkbenchReopenFromAgentRun(taskWaitingRun())).toBe('proposal');
  });

  it('patches and dirties task.create title + goalId', () => {
    const [item] = buildPendingHostProposalItems({ taskAgentRun: taskWaitingRun() });
    expect(item).toBeTruthy();
    const patch = buildHostProposalPatchFromDraft({
      kind: 'task.create',
      title: 'Renamed task',
      goalId: 'goal-2',
    });
    expect(patch).toEqual({ title: 'Renamed task', goalId: 'goal-2' });
    expect(
      isHostProposalDraftDirty({
        item: item!,
        title: 'Renamed task',
        goalId: 'goal-1',
      }),
    ).toBe(true);
    expect(
      isHostProposalDraftDirty({
        item: item!,
        title: item!.title,
        goalId: item!.goalId ?? null,
      }),
    ).toBe(false);
  });
});
