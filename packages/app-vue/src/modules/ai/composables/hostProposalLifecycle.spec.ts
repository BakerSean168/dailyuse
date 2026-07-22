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
  resolveHostWorkbenchFocusFromAgentRun,
  resolveHostWorkbenchFocusFromSessionRuns,
  resolveLinkedGoalIdFromTaskAgentRun,
  buildHostProposalPatchFromDraft,
  buildPendingHostProposalItems,
  dispatchHostProposalDecision,
  dispatchHostProposalRevise,
  getRememberedHostProposalRevision,
  isHostProposalDraftDirty,
  partitionHostTimelineArtifactsBySurface,
  collectHostTimelineSurfaceIsolationViolations,
  composeHostWorkbenchTimelineArtifacts,
  applyHostTaskPatchToAgentActions,
  buildHostTaskCreateTemplateRequest,
  buildHostTaskClientExecutionReceipt,
  filterPendingHostProposalsByClientSettlement,
  mergeHostExecutionReceiptItems,
  isPrimaryTaskHostAgentRun,
  isTaskShapedHostAgentRun,
  resolveLiveHostWorkbenchAgentRuns,
  shouldReviseProcessLocalTaskDraftBeforeDomainSettle,
  canHostApproveProductAgentRun,
  canHostRejectProductAgentRun,
  canHostReviseProductAgentRun,
  resolveHostPanelOwnedProductRun,
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

describe('applyHost*Patch sole product draftAction (residual 551)', () => {
  it('does not invent identical Host knowledge patch across multi create_knowledge_note drafts', () => {
    const actions = [
      {
        tool: 'create_knowledge_note',
        payload: { contentMarkdown: '# a', targetSubpath: 'notes/a' },
        rationale: 'a',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        payload: { contentMarkdown: '# b', targetSubpath: 'notes/b' },
        rationale: 'b',
        index: 1,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostKnowledgePatchToAgentActions(actions, {
      targetPath: 'notes/edited',
      contentMarkdown: '# revised',
    });

    expect(patched[0]?.payload).toMatchObject({
      contentMarkdown: '# a',
      targetSubpath: 'notes/a',
    });
    expect(patched[1]?.payload).toMatchObject({
      contentMarkdown: '# b',
      targetSubpath: 'notes/b',
    });
    expect(patched[0]?.payload).not.toMatchObject({ targetSubpath: 'notes/edited' });
  });

  it('does not invent identical Host goal patch across multi create_goal drafts', () => {
    const actions = [
      {
        tool: 'create_goal',
        payload: { title: 'A', description: 'da' },
        rationale: 'a',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_goal',
        payload: { title: 'B', description: 'db' },
        rationale: 'b',
        index: 1,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostGoalPatchToAgentActions(actions, {
      title: 'Host revised',
      description: 'Host desc',
    });

    expect(patched[0]?.payload).toMatchObject({ title: 'A', description: 'da' });
    expect(patched[1]?.payload).toMatchObject({ title: 'B', description: 'db' });
  });

  it('does not invent identical Host task patch across multi create_task_template drafts', () => {
    const actions = [
      {
        tool: 'create_task_template',
        payload: { title: 'A', goalId: 'g-a' },
        rationale: 'a',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        payload: { title: 'B', goalId: 'g-b' },
        rationale: 'b',
        index: 1,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostTaskPatchToAgentActions(actions, {
      title: 'Host Task',
      goalId: 'goal-host',
    });

    expect(patched[0]?.payload).toMatchObject({ title: 'A', goalId: 'g-a' });
    expect(patched[1]?.payload).toMatchObject({ title: 'B', goalId: 'g-b' });
  });

  it('still patches sole create_task_template when foreign tools accompany it', () => {
    const actions = [
      {
        tool: 'create_goal',
        payload: { title: 'Goal' },
        rationale: 'g',
        index: 0,
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        payload: { title: 'Old', goalId: 'g0' },
        rationale: 't',
        index: 1,
        dependsOn: [],
      },
    ] as AgentAction[];

    const patched = applyHostTaskPatchToAgentActions(actions, {
      title: 'New Task',
      goalId: 'goal-42',
    });

    expect(patched[0]?.payload).toEqual({ title: 'Goal' });
    expect(patched[1]?.payload).toMatchObject({
      title: 'New Task',
      name: 'New Task',
      goalId: 'goal-42',
    });
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

describe('Host task.create live lane + domain executor foundation (residual 423)', () => {
  it('classifies primary task-shaped runs and exclusive live workbench routing', () => {
    const taskOnly = taskWaitingRun();
    expect(isTaskShapedHostAgentRun(taskOnly)).toBe(true);
    expect(isPrimaryTaskHostAgentRun(taskOnly)).toBe(true);

    const goalWithDraft = taskWaitingRun();
    goalWithDraft.state.artifacts = [
      { kind: 'goal_draft', title: 'G', data: {} },
      { kind: 'task_draft', title: 'T', data: {} },
    ] as typeof goalWithDraft.state.artifacts;
    expect(isTaskShapedHostAgentRun(goalWithDraft)).toBe(true);
    expect(isPrimaryTaskHostAgentRun(goalWithDraft)).toBe(false);

    const live = resolveLiveHostWorkbenchAgentRuns({ goalAgentRun: taskOnly });
    expect(live.goalAgentRun).toBeNull();
    expect(live.taskAgentRun?.run.runId).toBe('run-task-1');

    const goalLane = resolveLiveHostWorkbenchAgentRuns({ goalAgentRun: goalWithDraft });
    expect(goalLane.goalAgentRun?.run.runId).toBe('run-task-1');
    expect(goalLane.taskAgentRun).toBeNull();
  });

  it('patches create_task_template title + goalId and builds createTemplate fallback body', () => {
    const actions = [
      {
        tool: 'create_task_template' as const,
        rationale: 'r',
        payload: { title: 'Old', goalId: 'g0' },
        dependsOn: [] as number[],
      },
      {
        tool: 'create_goal' as const,
        rationale: 'g',
        payload: { title: 'Goal' },
        dependsOn: [] as number[],
      },
    ];
    const patched = applyHostTaskPatchToAgentActions(actions as never, {
      title: '  New Task  ',
      goalId: 'goal-42',
    });
    expect(patched[0]?.payload).toMatchObject({
      title: 'New Task',
      name: 'New Task',
      goalId: 'goal-42',
    });
    expect(patched[1]?.payload).toEqual({ title: 'Goal' });

    const req = buildHostTaskCreateTemplateRequest({
      title: ' Ship it ',
      goalId: 'goal-9',
    });
    expect(req).toMatchObject({
      name: 'Ship it',
      taskType: 'OneTime',
      importance: 'Moderate',
      tags: ['goal:goal-9'],
      timeConfig: { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
    });
    expect(buildHostTaskCreateTemplateRequest({ title: '   ' })).toBeNull();
  });
});

describe('Host task.create client settlement + receipt (residual 425)', () => {
  it('builds client createTemplate receipt with primaryEntityId deep-link', () => {
    const receipt = buildHostTaskClientExecutionReceipt({
      runId: 'run-task-1',
      proposalId: 'agent-run:run-task-1:task.create',
      revision: 1,
      title: 'Ship Host Task lane',
      templateId: 'tmpl-1',
      goalId: 'goal-1',
    });
    expect(receipt).toMatchObject({
      kind: 'task.create',
      source: 'task',
      runStatus: 'completed',
      ok: true,
      primaryEntityId: 'tmpl-1',
      entityIds: ['tmpl-1'],
      executedCount: 1,
    });
    expect(receipt.actionLines[0]).toMatchObject({
      tool: 'create_task_template',
      status: 'executed',
      entityId: 'tmpl-1',
    });
  });

  it('filters settled pending proposals and merges client receipts without duplicates', () => {
    const pending = buildPendingHostProposalItems({ taskAgentRun: taskWaitingRun() });
    expect(pending).toHaveLength(1);
    const settled = filterPendingHostProposalsByClientSettlement(pending, [
      pending[0]!.proposalId,
    ]);
    expect(settled).toEqual([]);

    const suppressed = buildPendingHostProposalItems({
      taskAgentRun: taskWaitingRun(),
      settledProposalIds: [pending[0]!.proposalId],
    });
    expect(suppressed).toEqual([]);

    const client = buildHostTaskClientExecutionReceipt({
      runId: 'run-task-1',
      proposalId: 'agent-run:run-task-1:task.create',
      revision: 1,
      title: 'Ship Host Task lane',
      templateId: 'tmpl-1',
    });
    const merged = mergeHostExecutionReceiptItems([], [client]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.primaryEntityId).toBe('tmpl-1');

    const withDup = mergeHostExecutionReceiptItems([client], [
      { ...client, primaryEntityId: 'other' },
    ]);
    expect(withDup).toHaveLength(1);
    expect(withDup[0]?.primaryEntityId).toBe('tmpl-1');

    const viaBuilder = buildHostExecutionReceiptItems({
      clientTaskReceipts: [client],
    });
    expect(viaBuilder).toEqual([client]);
  });
});

describe('Host AgentType task.create foundation (residual 427)', () => {
  it('treats agentType task.create as primary Host task lane without artifacts', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    expect(isTaskShapedHostAgentRun(run)).toBe(false);
    expect(isPrimaryTaskHostAgentRun(run)).toBe(true);

    const live = resolveLiveHostWorkbenchAgentRuns({ taskAgentRun: run });
    expect(live.taskAgentRun?.run.agentType).toBe('task.create');
    expect(live.goalAgentRun).toBeNull();

    const reopen = resolveHostWorkbenchReopenFromAgentRun(run);
    expect(reopen).toBe('proposal');
  });
});

describe('Host workbench focus from AgentRun history (residual 441)', () => {
  it('focuses proposal for waiting task.create and receipt for completed process-local run', () => {
    const waiting = taskWaitingRun();
    waiting.run.agentType = 'task.create';
    waiting.state.artifacts = [];
    const focusWaiting = resolveHostWorkbenchFocusFromAgentRun(waiting);
    expect(focusWaiting).toEqual({
      proposalId: 'agent-run:run-task-1:task.create',
      surface: 'proposal',
    });

    const completed = taskWaitingRun();
    completed.run.agentType = 'task.create';
    completed.run.status = 'completed';
    completed.state.artifacts = [];
    completed.state.pendingActions = [];
    completed.state.approvedActions = [
      {
        tool: 'create_task_template',
        index: 0,
        dependsOn: [],
        rationale: 'settled',
        payload: { title: 'Ship Host Task lane', goalId: 'goal-1' },
      },
    ] as any;
    completed.state.executedActions = [
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'tmpl-1',
        data: { title: 'Ship Host Task lane' },
      },
    ] as any;
    const focusCompleted = resolveHostWorkbenchFocusFromAgentRun(completed);
    expect(focusCompleted).toEqual({
      proposalId: 'agent-run:run-task-1:task.create',
      surface: 'receipt',
    });

    // Title recovery after cancel clears pendingActions.
    const cancelled = taskWaitingRun();
    cancelled.run.agentType = 'task.create';
    cancelled.run.status = 'cancelled';
    cancelled.state.artifacts = [];
    cancelled.state.pendingActions = [];
    cancelled.state.approvedActions = [];
    cancelled.state.messages = [
      { role: 'user', content: 'Recovered cancel title', createdAt: 1 },
    ] as any;
    cancelled.events = [
      {
        eventId: 'e1',
        runId: 'run-task-1',
        sequence: 0,
        type: 'approval.required',
        createdAt: 1,
        data: { title: 'Event title wins' },
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: cancelled });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.title).toBe('Event title wins');
  });

  it('returns null focus when AgentRun is not a Host workbench owner', () => {
    expect(resolveHostWorkbenchFocusFromAgentRun(null)).toBeNull();
    const qa = goalWaitingRun();
    qa.run.agentType = 'knowledge.qa' as any;
    qa.state.artifacts = [];
    qa.state.pendingActions = [];
    expect(resolveHostWorkbenchFocusFromAgentRun(qa)).toBeNull();
  });
});

describe('Host workbench focus from session restore (residual 443)', () => {
  it('prefers exclusive task.create lane over goal/knowledge when resolving session focus', () => {
    const task = taskWaitingRun();
    task.run.agentType = 'task.create';
    task.state.artifacts = [];
    const goal = goalWaitingRun();
    const focus = resolveHostWorkbenchFocusFromSessionRuns({
      taskAgentRun: task,
      goalAgentRun: goal,
      noteAgentRun: null,
    });
    expect(focus).toEqual({
      proposalId: 'agent-run:run-task-1:task.create',
      surface: 'proposal',
    });
  });

  it('falls back to goal then knowledge, and null when none reopen', () => {
    const goal = goalWaitingRun();
    expect(
      resolveHostWorkbenchFocusFromSessionRuns({
        taskAgentRun: null,
        goalAgentRun: goal,
        noteAgentRun: null,
      })?.proposalId,
    ).toBe('agent-run:run-1:goal.create');

    expect(
      resolveHostWorkbenchFocusFromSessionRuns({
        taskAgentRun: null,
        goalAgentRun: null,
        noteAgentRun: null,
      }),
    ).toBeNull();
  });
});

describe('resolveLinkedGoalIdFromTaskAgentRun (residual 445)', () => {
  it('reads linked goalId from task.create pending create_task_template payload', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    expect(resolveLinkedGoalIdFromTaskAgentRun(run)).toBe('goal-1');
  });

  it('returns null for non-task Host runs and empty payloads', () => {
    expect(resolveLinkedGoalIdFromTaskAgentRun(null)).toBeNull();
    const goal = goalWaitingRun();
    expect(resolveLinkedGoalIdFromTaskAgentRun(goal)).toBeNull();
    const bare = taskWaitingRun();
    bare.run.agentType = 'task.create';
    bare.state.artifacts = [];
    bare.state.pendingActions = [];
    bare.state.approvedActions = [];
    expect(resolveLinkedGoalIdFromTaskAgentRun(bare)).toBeNull();
  });
});

describe('task draft create_task_template-only payload (residual 519)', () => {
  it('ignores foreign pending[0] tool when reading title/goalId for workbench', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    // Foreign tool first — must not steal title/goalId from create_task_template.
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: { title: 'Foreign Goal Title', goalId: 'foreign-goal' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'task',
        payload: { title: 'Real Task Title', goalId: 'goal-real' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Real Task Title');
    expect(items[0]?.goalId).toBe('goal-real');
    expect(resolveLinkedGoalIdFromTaskAgentRun(run)).toBe('goal-real');
  });

  it('does not invent title/goalId from foreign-only pending actions', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign-only',
        payload: { title: 'Only Foreign', goalId: 'foreign-only' },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    // Falls through to user message / empty — not foreign pending payload.
    expect(items[0]?.title).not.toBe('Only Foreign');
    expect(items[0]?.goalId).not.toBe('foreign-only');
    expect(resolveLinkedGoalIdFromTaskAgentRun(run)).toBeNull();
  });
});

describe('product draft sole draftAction gate (residual 549)', () => {
  it('does not invent task title/goalId when multiple create_task_template drafts exist', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'first',
        payload: { title: 'First Task', goalId: 'goal-1' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'second',
        payload: { title: 'Second Task', goalId: 'goal-2' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    // Residual 549: multi product drafts fail-closed (no multi-find invent of first).
    expect(items[0]?.title).not.toBe('First Task');
    expect(items[0]?.title).not.toBe('Second Task');
    expect(items[0]?.goalId).not.toBe('goal-1');
    expect(items[0]?.goalId).not.toBe('goal-2');
    expect(resolveLinkedGoalIdFromTaskAgentRun(run)).toBeNull();
  });

  it('still reads sole create_task_template when foreign tools also pending', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: { title: 'Foreign Goal', goalId: 'foreign-goal' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'task',
        payload: { title: 'Sole Task', goalId: 'goal-sole' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Sole Task');
    expect(items[0]?.goalId).toBe('goal-sole');
  });

  it('does not invent knowledge path when multiple create_knowledge_note drafts exist', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_knowledge_note',
        rationale: 'first',
        payload: { targetSubpath: 'notes/first', contentMarkdown: '# first', title: 'First' },
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'second',
        payload: { targetSubpath: 'notes/second', contentMarkdown: '# second', title: 'Second' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.targetPath).not.toBe('notes/first');
    expect(items[0]?.targetPath).not.toBe('notes/second');
    expect(items[0]?.title).not.toBe('First');
    expect(items[0]?.title).not.toBe('Second');
  });
});

describe('knowledge draft create_knowledge_note-only payload (residual 521)', () => {
  it('ignores foreign pending[0] tool when reading path/markdown for workbench', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [
      {
        artifactId: 'n1',
        kind: 'knowledge_note_draft',
        title: 'AI Note Draft',
        data: { title: 'AI Note Draft' },
        updatedAt: 2,
      },
    ];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: {
          targetSubpath: 'notes/foreign',
          contentMarkdown: '# foreign body',
        },
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'note',
        payload: {
          targetSubpath: 'notes/real',
          contentMarkdown: '# real body',
        },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.targetPath).toBe('notes/real');
    expect(items[0]?.contentMarkdown).toBe('# real body');
  });

  it('does not invent path/markdown from foreign-only pending actions', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [
      {
        artifactId: 'n1',
        kind: 'knowledge_note_draft',
        title: 'AI Note Draft',
        data: { title: 'AI Note Draft' },
        updatedAt: 2,
      },
    ];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign-only',
        payload: {
          targetSubpath: 'notes/foreign-only',
          contentMarkdown: '# only foreign',
        },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.targetPath).not.toBe('notes/foreign-only');
    expect(items[0]?.contentMarkdown).not.toBe('# only foreign');
    expect(items[0]?.targetPath ?? '').toBe('');
    expect(items[0]?.contentMarkdown ?? '').toBe('');
  });
});

describe('knowledge draft title create_knowledge_note-only payload (residual 531)', () => {
  it('reads title from create_knowledge_note payload when artifact title is empty', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [
      {
        artifactId: 'n1',
        kind: 'knowledge_note_draft',
        data: {},
        updatedAt: 2,
      },
    ];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: { title: 'Foreign Goal Title' },
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'note',
        payload: {
          title: 'Real Note Title',
          targetSubpath: 'notes/real',
          contentMarkdown: '# real',
        },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Real Note Title');
    expect(items[0]?.title).not.toBe('Foreign Goal Title');
  });

  it('ignores foreign pending[0] tool when reading title for workbench', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: { title: 'Foreign Goal Title' },
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'note',
        payload: {
          title: 'Real Note From Payload',
          targetSubpath: 'notes/real',
          contentMarkdown: '# real',
        },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Real Note From Payload');
  });

  it('does not invent title from foreign-only pending actions', () => {
    const run = noteWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign-only',
        payload: { title: 'Only Foreign Title' },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).not.toBe('Only Foreign Title');
    // Falls through to empty title fallback label, not foreign payload.
    expect(items[0]?.title).toContain('Knowledge run');
  });
});

describe('goal draft create_goal-only payload (residual 523)', () => {
  it('ignores foreign pending[0] tool when reading title/description for workbench', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign',
        payload: { title: 'Foreign Task Title', description: 'Foreign task desc' },
        dependsOn: [],
      },
      {
        tool: 'create_goal',
        rationale: 'goal',
        payload: { title: 'Real Goal Title', description: 'Real goal description' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Real Goal Title');
    expect(items[0]?.description).toBe('Real goal description');
  });

  it('does not invent title/description from foreign-only pending actions', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign-only',
        payload: { title: 'Only Foreign', description: 'Only foreign desc' },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.title).not.toBe('Only Foreign');
    expect(items[0]?.description).not.toBe('Only foreign desc');
    // Falls through to empty title fallback label, not foreign payload.
    expect(items[0]?.title).toContain('Goal run');
    expect(items[0]?.description ?? '').toBe('');
  });
});

describe('workbench summary product-lane rationale (residual 525)', () => {
  it('goal summary ignores foreign pending[0] tool rationale', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign task rationale',
        payload: { title: 'Foreign Task' },
        dependsOn: [],
      },
      {
        tool: 'create_goal',
        rationale: 'real goal rationale',
        payload: { title: 'Real Goal' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.summary).toBe('real goal rationale');
  });

  it('knowledge summary ignores foreign pending[0] tool rationale', () => {
    const run = noteWaitingRun();
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign goal rationale',
        payload: {},
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'real note rationale',
        payload: { targetSubpath: 'notes/real', contentMarkdown: '# real' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.summary).toBe('real note rationale');
  });

  it('task summary ignores foreign pending[0] tool rationale', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign goal rationale',
        payload: { title: 'Foreign' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'real task rationale',
        payload: { title: 'Real Task', goalId: 'goal-real' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.summary).toBe('real task rationale');
  });

  it('does not invent summary from foreign-only pending actions', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign-only rationale',
        payload: { title: 'Only Foreign' },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.summary).toBe('');
    expect(items[0]?.summary).not.toBe('foreign-only rationale');
  });
});

describe('workbench pendingActionCount product-lane only (residual 527)', () => {
  it('goal count ignores foreign pending tools', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign',
        payload: { title: 'Foreign Task' },
        dependsOn: [],
      },
      {
        tool: 'create_goal',
        rationale: 'goal',
        payload: { title: 'Real Goal' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'foreign-2',
        payload: { title: 'Foreign Task 2' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.pendingActionCount).toBe(1);
  });

  it('knowledge count ignores foreign pending tools', () => {
    const run = noteWaitingRun();
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: {},
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'note',
        payload: { targetSubpath: 'notes/real', contentMarkdown: '# real' },
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ noteAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.pendingActionCount).toBe(1);
  });

  it('task count ignores foreign pending tools', () => {
    const run = taskWaitingRun();
    run.run.agentType = 'task.create';
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_goal',
        rationale: 'foreign',
        payload: { title: 'Foreign' },
        dependsOn: [],
      },
      {
        tool: 'create_task_template',
        rationale: 'task',
        payload: { title: 'Real Task', goalId: 'goal-real' },
        dependsOn: [],
      },
      {
        tool: 'create_knowledge_note',
        rationale: 'foreign-note',
        payload: {},
        dependsOn: [],
      },
    ];
    const items = buildPendingHostProposalItems({ taskAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.pendingActionCount).toBe(1);
  });

  it('returns 0 when only foreign tools are pending', () => {
    const run = goalWaitingRun();
    run.state.artifacts = [];
    run.state.pendingActions = [
      {
        tool: 'create_task_template',
        rationale: 'foreign-only',
        payload: { title: 'Only Foreign' },
        dependsOn: [],
      },
    ];
    run.state.approvedActions = [];
    const items = buildPendingHostProposalItems({ goalAgentRun: run });
    expect(items).toHaveLength(1);
    expect(items[0]?.pendingActionCount).toBe(0);
  });
});

describe('receipt primaryEntityId product-lane only (residual 529)', () => {
  it('task receipt ignores foreign executed tool entityId for deep-link', () => {
    const run = taskWaitingRun();
    run.run.status = 'completed';
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'foreign goal',
        entityId: 'foreign-goal-1',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'task-real-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.primaryEntityId).toBe('task-real-1');
    expect(receipts[0]?.primaryEntityId).not.toBe('foreign-goal-1');
  });

  it('goal receipt ignores foreign executed tool entityId for deep-link', () => {
    const run = goalWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'foreign task',
        entityId: 'foreign-task-1',
      },
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'created',
        entityId: 'goal-real-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ goalAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.primaryEntityId).toBe('goal-real-1');
    expect(receipts[0]?.primaryEntityId).not.toBe('foreign-task-1');
  });

  it('knowledge receipt ignores foreign executed tool entityId for deep-link', () => {
    const run = noteWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'foreign',
        entityId: 'foreign-goal-9',
      },
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        message: 'created',
        entityId: 'note-real-9',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.primaryEntityId).toBe('note-real-9');
    expect(receipts[0]?.primaryEntityId).not.toBe('foreign-goal-9');
  });

  it('does not invent primaryEntityId from foreign-only executed actions', () => {
    const run = taskWaitingRun();
    run.run.status = 'completed';
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'foreign-only',
        entityId: 'foreign-only-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: run });
    // Residual 533: cross-lane foreign-only execution does not surface a task receipt.
    expect(receipts).toHaveLength(0);
  });
});

describe('receipt summary excludes cross-lane foreign tools (residual 533)', () => {
  it('task receipt ignores foreign create_goal from counts/actionLines/entityIds', () => {
    const run = taskWaitingRun();
    run.run.status = 'completed';
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'foreign goal',
        entityId: 'foreign-goal-1',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'task-real-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.executedCount).toBe(1);
    expect(receipts[0]?.entityIds).toEqual(['task-real-1']);
    expect(receipts[0]?.actionLines).toEqual([
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'task-real-1',
      },
    ]);
    expect(receipts[0]?.summary).toBe('1 executed, 0 skipped, 0 failed');
  });

  it('goal receipt keeps same-lane create_key_result but drops create_task_template', () => {
    const run = goalWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'foreign task',
        entityId: 'foreign-task-1',
      },
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'created',
        entityId: 'goal-real-1',
      },
      {
        tool: 'create_key_result',
        status: 'skipped',
        message: 'skipped',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ goalAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.executedCount).toBe(1);
    expect(receipts[0]?.skippedCount).toBe(1);
    expect(receipts[0]?.entityIds).toEqual(['goal-real-1']);
    expect(receipts[0]?.actionLines.map((line) => line.tool)).toEqual([
      'create_goal',
      'create_key_result',
    ]);
    expect(receipts[0]?.primaryEntityId).toBe('goal-real-1');
  });

  it('knowledge receipt drops foreign create_goal from actionLines', () => {
    const run = noteWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'failed',
        message: 'foreign fail',
        entityId: 'foreign-goal-9',
      },
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        message: 'created',
        entityId: 'note-real-9',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.executedCount).toBe(1);
    expect(receipts[0]?.failedCount).toBe(0);
    expect(receipts[0]?.entityIds).toEqual(['note-real-9']);
    expect(receipts[0]?.actionLines).toHaveLength(1);
    expect(receipts[0]?.actionLines[0]?.tool).toBe('create_knowledge_note');
  });
});

describe('receipt summary same-lane failed message only (residual 535)', () => {
  it('ignores foreign run.state.errors[0] when same-lane actions all succeed', () => {
    const run = taskWaitingRun();
    run.run.status = 'completed';
    run.state.pendingActions = [];
    run.state.errors = ['foreign-lane boom'];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'failed',
        message: 'foreign failed',
        entityId: 'foreign-goal-1',
      },
      {
        tool: 'create_task_template',
        status: 'executed',
        message: 'created',
        entityId: 'task-real-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.summary).toBe('1 executed, 0 skipped, 0 failed');
    expect(receipts[0]?.summary).not.toContain('foreign-lane boom');
    expect(receipts[0]?.summary).not.toContain('foreign failed');
  });

  it('uses same-lane failed action message for receipt summary', () => {
    const run = noteWaitingRun('failed');
    run.state.pendingActions = [];
    run.state.errors = ['stale foreign error first'];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'failed',
        message: 'foreign fail text',
      },
      {
        tool: 'create_knowledge_note',
        status: 'failed',
        message: 'write denied by policy',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.summary).toContain('write denied by policy');
    expect(receipts[0]?.summary).not.toContain('stale foreign error first');
    expect(receipts[0]?.summary).not.toContain('foreign fail text');
  });

  it('does not invent summary error when same-lane has no failed message', () => {
    const run = goalWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.errors = ['orphan error without failed action'];
    run.state.executedActions = [
      {
        tool: 'create_goal',
        status: 'executed',
        message: 'created',
        entityId: 'goal-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ goalAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.summary).toBe('1 executed, 0 skipped, 0 failed');
    expect(receipts[0]?.summary).not.toContain('orphan error');
  });
});

describe('receipt ok requires product-lane executed (residual 537)', () => {
  it('marks completed goal ok when create_goal executed even if companion skipped', () => {
    const run = goalWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
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
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ goalAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.ok).toBe(true);
    expect(receipts[0]?.primaryEntityId).toBe('goal-1');
  });

  it('marks completed task not ok when only foreign tools executed', () => {
    const run = taskWaitingRun();
    run.run.status = 'completed';
    run.state.pendingActions = [];
    // Foreign-only is filtered (residual 533) so no receipt — pair with companion-only case.
    run.state.executedActions = [
      {
        tool: 'create_task_template',
        status: 'skipped',
        message: 'skipped product',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ taskAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.ok).toBe(false);
    expect(receipts[0]?.executedCount).toBe(0);
    expect(receipts[0]?.skippedCount).toBe(1);
  });

  it('marks completed knowledge not ok when product tool failed then filtered companions only succeed is N/A', () => {
    const run = noteWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'skipped',
        message: 'note skipped',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.ok).toBe(false);
  });

  it('marks completed with product executed and zero failures as ok', () => {
    const run = noteWaitingRun('completed');
    run.state.pendingActions = [];
    run.state.executedActions = [
      {
        tool: 'create_knowledge_note',
        status: 'executed',
        message: 'created',
        entityId: 'note-ok-1',
      },
    ] as any;
    const receipts = buildHostExecutionReceiptItems({ noteAgentRun: run });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.ok).toBe(true);
    expect(receipts[0]?.primaryEntityId).toBe('note-ok-1');
  });
});



describe('shouldReviseProcessLocalTaskDraftBeforeDomainSettle (residual 459)', () => {
  it('returns true only for dirty owned task.create sessions', () => {
    expect(
      shouldReviseProcessLocalTaskDraftBeforeDomainSettle({
        dirty: true,
        isTaskAgentType: true,
        ownedByTaskSession: true,
        agentType: 'task.create',
      }),
    ).toBe(true);
  });

  it('returns false when not dirty, not owned, or not task.create', () => {
    expect(
      shouldReviseProcessLocalTaskDraftBeforeDomainSettle({
        dirty: false,
        isTaskAgentType: true,
        ownedByTaskSession: true,
        agentType: 'task.create',
      }),
    ).toBe(false);
    expect(
      shouldReviseProcessLocalTaskDraftBeforeDomainSettle({
        dirty: true,
        isTaskAgentType: true,
        ownedByTaskSession: false,
        agentType: 'task.create',
      }),
    ).toBe(false);
    expect(
      shouldReviseProcessLocalTaskDraftBeforeDomainSettle({
        dirty: true,
        isTaskAgentType: false,
        ownedByTaskSession: true,
        agentType: 'task.create',
      }),
    ).toBe(false);
    expect(
      shouldReviseProcessLocalTaskDraftBeforeDomainSettle({
        dirty: true,
        isTaskAgentType: true,
        ownedByTaskSession: true,
        agentType: 'goal.create',
      }),
    ).toBe(false);
  });
});

describe('canHostApproveProductAgentRun (residual 561/563)', () => {
  function runWith(
    status: AgentRunResult['run']['status'],
    tools: string[],
  ): AgentRunResult {
    return {
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: 'conv-1',
        agentType: 'goal.create',
        status,
        createdAt: 1,
        updatedAt: 1,
      },
      state: {
        pendingActions: tools.map((tool, index) => ({
          tool,
          index,
          dependsOn: [],
          payload: {},
          rationale: tool,
        })),
        approvedActions: [],
        executedActions: [],
        artifacts: [],
        interrupts: [],
      },
    } as AgentRunResult;
  }

  it('allows waiting_approval with sole create_goal', () => {
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['create_goal', 'create_key_result']),
        productTool: 'create_goal',
      }),
    ).toBe(true);
  });

  it('rejects multi create_goal and non-waiting statuses', () => {
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['create_goal', 'create_goal']),
        productTool: 'create_goal',
      }),
    ).toBe(false);
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_execution', ['create_goal']),
        productTool: 'create_goal',
      }),
    ).toBe(false);
    expect(
      canHostApproveProductAgentRun({
        run: null,
        productTool: 'create_goal',
      }),
    ).toBe(false);
  });

  it('allows knowledge sole create_knowledge_note and rejects missing product draft', () => {
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['create_knowledge_note', 'search_knowledge']),
        productTool: 'create_knowledge_note',
      }),
    ).toBe(true);
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['search_knowledge']),
        productTool: 'create_knowledge_note',
      }),
    ).toBe(false);
  });

  it('allows task sole create_task_template and rejects multi product drafts (residual 563)', () => {
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['create_task_template', 'search_knowledge']),
        productTool: 'create_task_template',
      }),
    ).toBe(true);
    expect(
      canHostApproveProductAgentRun({
        run: runWith('waiting_approval', ['create_task_template', 'create_task_template']),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
    expect(
      canHostApproveProductAgentRun({
        run: runWith('completed', ['create_task_template']),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
  });
});

describe('canHostRejectProductAgentRun (residual 565)', () => {
  function runWith(status: AgentRunResult['run']['status']): AgentRunResult {
    return {
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: 'conv-1',
        agentType: 'task.create',
        status,
        createdAt: 1,
        updatedAt: 1,
      },
      state: {
        pendingActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            payload: {},
            rationale: 'draft',
          },
        ],
        approvedActions: [],
        executedActions: [],
        artifacts: [],
        interrupts: [],
      },
    } as AgentRunResult;
  }

  it('allows waiting_approval only', () => {
    expect(canHostRejectProductAgentRun({ run: runWith('waiting_approval') })).toBe(true);
    expect(canHostRejectProductAgentRun({ run: runWith('waiting_execution') })).toBe(false);
    expect(canHostRejectProductAgentRun({ run: runWith('completed') })).toBe(false);
    expect(canHostRejectProductAgentRun({ run: null })).toBe(false);
  });
});

describe('canHostReviseProductAgentRun (residual 567/573)', () => {
  function runWith(
    status: AgentRunResult['run']['status'],
    tools: string[] = ['create_task_template'],
  ): AgentRunResult {
    return {
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: 'conv-1',
        agentType: 'task.create',
        status,
        createdAt: 1,
        updatedAt: 1,
      },
      state: {
        pendingActions: tools.map((tool, index) => ({
          tool,
          index,
          dependsOn: [],
          payload: {},
          rationale: tool,
        })),
        approvedActions: [],
        executedActions: [],
        artifacts: [],
        interrupts: [],
      },
    } as AgentRunResult;
  }

  it('requires waiting_approval (residual 567)', () => {
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval'),
        productTool: 'create_task_template',
      }),
    ).toBe(true);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_execution'),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('completed'),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
    expect(
      canHostReviseProductAgentRun({
        run: null,
        productTool: 'create_task_template',
      }),
    ).toBe(false);
  });

  it('requires sole product draftAction (residual 573 approve symmetry)', () => {
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_task_template', 'search_knowledge']),
        productTool: 'create_task_template',
      }),
    ).toBe(true);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_task_template', 'create_task_template']),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_goal', 'create_key_result']),
        productTool: 'create_goal',
      }),
    ).toBe(true);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_goal', 'create_goal']),
        productTool: 'create_goal',
      }),
    ).toBe(false);
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_knowledge_note']),
        productTool: 'create_knowledge_note',
      }),
    ).toBe(true);
    // Reject remains WA-only; revise is stricter (sole product).
    expect(canHostRejectProductAgentRun({ run: runWith('waiting_approval', ['create_task_template', 'create_task_template']) })).toBe(
      true,
    );
    expect(
      canHostReviseProductAgentRun({
        run: runWith('waiting_approval', ['create_task_template', 'create_task_template']),
        productTool: 'create_task_template',
      }),
    ).toBe(false);
  });
});

describe('resolveHostPanelOwnedProductRun (residual 569)', () => {
  function makeRun(
    runId: string,
    agentType: string,
  ): AgentRunResult {
    return {
      run: {
        runId,
        threadId: 'thread-1',
        conversationId: 'conv-1',
        agentType,
        status: 'waiting_approval',
        createdAt: 1,
        updatedAt: 1,
      },
      state: {
        pendingActions: [],
        approvedActions: [],
        executedActions: [],
        artifacts: [],
        interrupts: [],
      },
    } as AgentRunResult;
  }

  it('maps goal/knowledge/task session ownership to sole product tools', () => {
    const goal = makeRun('g-1', 'goal.create');
    const note = makeRun('n-1', 'knowledge.generate');
    const task = makeRun('t-1', 'task.create');
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'goal',
        runId: 'g-1',
        goalAgentRun: goal,
      })?.productTool,
    ).toBe('create_goal');
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'knowledge',
        runId: 'n-1',
        noteAgentRun: note,
      })?.productTool,
    ).toBe('create_knowledge_note');
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'task',
        runId: 't-1',
        taskAgentRun: task,
      })?.productTool,
    ).toBe('create_task_template');
  });

  it('maps task-shaped goal-owned run and leaves orphan task null', () => {
    const goal = makeRun('shared-1', 'goal.create');
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'task',
        runId: 'shared-1',
        goalAgentRun: goal,
        taskAgentRun: null,
      })?.productTool,
    ).toBe('create_goal');
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'task',
        runId: 'orphan-1',
        goalAgentRun: goal,
        taskAgentRun: null,
      }),
    ).toBeNull();
    expect(
      resolveHostPanelOwnedProductRun({
        source: 'goal',
        runId: 'missing',
        goalAgentRun: goal,
      }),
    ).toBeNull();
  });
});

