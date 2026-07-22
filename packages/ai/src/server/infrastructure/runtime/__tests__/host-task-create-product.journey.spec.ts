/**
 * Residual 449/451/453/455/457/461/463/465/467: Host task.create process-local product journey (still partial for §13.2).
 *
 * Same-process fixture chain:
 *   start → store → edit → cancel
 *   start → confirm settle → get/list/events rehydrate
 *   identity fail-closed
 *   runId identity binding (residual 451)
 *   confirm requires client settlement (residual 453)
 *   edit requires non-empty title (residual 455)
 *   conversation/thread runId binding (residual 457)
 *   start requires conversationId (residual 461)
 *   confirm settlement title (residual 463)
 *   confirm settlement template id (residual 465)
 *   confirm settlement goalId no-rebind (residual 467)
 *   never hits Python port / never Host-lifecycle domain execution wire
 *
 * Not Playwright/Electron multi-engine E2E, not cross-process durable, not full LangGraph.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createAgentRuntimeService } from '../ai-runtime';
import { resetDefaultHostTaskCreateRunStoreForTests } from '../host-task-create-run-store';
import type { IAgentRuntimePort } from '../../../application/ports/agent-runtime.port';

function makePort(): IAgentRuntimePort {
  return {
    startRun: vi.fn().mockRejectedValue(new Error('port.startRun must not run for task.create')),
    resumeRun: vi.fn().mockRejectedValue(new Error('port.resumeRun must not run for stored task.create')),
    getRun: vi.fn().mockRejectedValue(new Error('port.getRun must not run for stored task.create')),
    listRuns: vi.fn().mockResolvedValue([]),
    getEvents: vi.fn().mockRejectedValue(new Error('port.getEvents must not run for stored task.create')),
  };
}

describe('Host task.create process-local product journey (residual 449)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('walks start → edit → cancel without Python port or Host-lifecycle domain execution wire', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-1' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-cancel',
        threadId: 'thread-journey-cancel',
        conversationId: 'conv-journey',
        identityId: 'client-body-must-not-win',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Draft task', goalId: 'goal-1' },
      },
      cx as any,
      'req-start',
    );
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.data.run.identityId).toBe('owner-1');
    expect(started.data.run.status).toBe('waiting_approval');
    expect(started.data.state.pendingActions[0]?.tool).toBe('create_task_template');
    expect(started.data.state.pendingActions[0]?.payload['goalId']).toBe('goal-1');
    expect(port.startRun).not.toHaveBeenCalled();

    const edited = await service.resumeRun(
      'run-journey-cancel',
      {
        userDecision: 'edit',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'revised',
            payload: { title: 'Revised draft', goalId: 'goal-2' },
          },
        ],
      },
      cx as any,
      'req-edit',
    );
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.data.run.status).toBe('waiting_approval');
    expect(edited.data.state.pendingActions[0]?.payload['title']).toBe('Revised draft');
    expect(edited.data.state.pendingActions[0]?.payload['goalId']).toBe('goal-2');
    expect(port.resumeRun).not.toHaveBeenCalled();

    const cancelled = await service.resumeRun(
      'run-journey-cancel',
      { userDecision: 'cancel' },
      cx as any,
      'req-cancel',
    );
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.run.status).toBe('cancelled');
    expect(cancelled.data.interrupts).toEqual([]);
    expect(cancelled.data.state.pendingActions).toEqual([]);

    const got = await service.getRun('run-journey-cancel', cx as any, 'req-get');
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.data.run.status).toBe('cancelled');
    expect(port.getRun).not.toHaveBeenCalled();

    // Product path keeps mutation client-owned; cancel does not invent executedActions.
    expect(got.data.state.executedActions).toEqual([]);
  });

  it('walks start → confirm settle → list/events rehydrate without Python port', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-2' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-complete',
        threadId: 'thread-journey-complete',
        conversationId: 'conv-journey-2',
        identityId: 'ignored',
        agentType: 'task.create',
        locale: 'zh-CN',
        input: { idea: 'Ship residual 449', goalId: 'goal-9' },
      },
      cx as any,
    );
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const completed = await service.resumeRun(
      'run-journey-complete',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template · linked goal goal-9',
            entityId: 'tmpl-449',
            data: { title: 'Ship residual 449', goalId: 'goal-9' },
          },
        ],
      },
      cx as any,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.data.run.status).toBe('completed');
    expect(completed.data.state.executedActions[0]?.entityId).toBe('tmpl-449');
    expect(port.resumeRun).not.toHaveBeenCalled();

    const listed = await service.listRuns(
      { conversationId: 'conv-journey-2', status: ['completed'] },
      cx as any,
    );
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.some((run) => run.runId === 'run-journey-complete')).toBe(true);

    const events = await service.getEvents('run-journey-complete', cx as any);
    expect(events.ok).toBe(true);
    if (!events.ok) return;
    expect(events.data.some((event) => event.type === 'approval.required')).toBe(true);
    expect(events.data.some((event) => event.type === 'run.completed')).toBe(true);
    expect(port.getEvents).not.toHaveBeenCalled();
  });

  it('fails closed across identity boundary for stored task.create journey runs', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);

    const started = await service.startRun(
      {
        runId: 'run-journey-owner',
        conversationId: 'conv-journey-owner',
        threadId: 'thread-journey-owner',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Owned' },
        identityId: 'ignored',
      },
      { identityId: 'owner-3' } as any,
    );
    expect(started.ok).toBe(true);

    await expect(
      service.getRun('run-journey-owner', { identityId: 'intruder' } as any),
    ).rejects.toThrow(/must not run for stored task.create|port\.getRun/);
  });

  it('rejects empty title at start without registering store entry', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-4' } as const;

    const rejected = await service.startRun(
      {
        runId: 'run-journey-empty',
        conversationId: 'conv-journey-empty',
        threadId: 'thread-journey-empty',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: '   ' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.error.code).toBe('VALIDATION_ERROR');

    const listed = await service.listRuns({}, cx as any);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.some((run) => run.runId === 'run-journey-empty')).toBe(false);
    expect(port.startRun).not.toHaveBeenCalled();
  });

  it('fails closed on foreign runId identity binding at start (residual 451)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);

    const owned = await service.startRun(
      {
        runId: 'run-bound-451',
        conversationId: 'conv-bound-451',
        threadId: 'thread-bound-451',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Owned draft' },
        identityId: 'ignored',
      },
      { identityId: 'owner-bound' } as any,
    );
    expect(owned.ok).toBe(true);

    const takeover = await service.startRun(
      {
        runId: 'run-bound-451',
        conversationId: 'conv-bound-451',
        threadId: 'thread-intruder-451',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Intruder draft' },
        identityId: 'ignored',
      },
      { identityId: 'intruder-bound' } as any,
    );
    expect(takeover.ok).toBe(false);
    if (takeover.ok) return;
    expect(takeover.error.code).toBe('FORBIDDEN');
    expect(takeover.error.message).toMatch(/already bound to another identity/);

    const stillOwned = await service.getRun('run-bound-451', { identityId: 'owner-bound' } as any);
    expect(stillOwned.ok).toBe(true);
    if (!stillOwned.ok) return;
    expect(stillOwned.data.run.identityId).toBe('owner-bound');
    expect(stillOwned.data.state.pendingActions[0]?.payload['title']).toBe('Owned draft');
    expect(port.startRun).not.toHaveBeenCalled();
  });


  it('fails closed when confirm omits client settlement executedActions (residual 453)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-settlement' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-settlement',
        conversationId: 'conv-journey-settlement',
        threadId: 'thread-journey-settlement',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Needs client settle' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started.ok).toBe(true);

    const bareConfirm = await service.resumeRun(
      'run-journey-settlement',
      { userDecision: 'confirm' },
      cx as any,
    );
    expect(bareConfirm.ok).toBe(false);
    if (bareConfirm.ok) return;
    expect(bareConfirm.error.code).toBe('VALIDATION_ERROR');
    expect(bareConfirm.error.message).toMatch(/client executedActions settlement/);

    const stillWaiting = await service.getRun('run-journey-settlement', cx as any);
    expect(stillWaiting.ok).toBe(true);
    if (!stillWaiting.ok) return;
    expect(stillWaiting.data.run.status).toBe('waiting_approval');
    expect(stillWaiting.data.state.executedActions).toEqual([]);
    expect(port.resumeRun).not.toHaveBeenCalled();
  });


  it('fails closed on blank edit title without mutating stored draft (residual 455)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-edit-title' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-edit-blank',
        conversationId: 'conv-journey-edit-blank',
        threadId: 'thread-journey-edit-blank',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Keep original' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started.ok).toBe(true);

    const blankEdit = await service.resumeRun(
      'run-journey-edit-blank',
      {
        userDecision: 'edit',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'blank',
            payload: { title: '   ' },
          },
        ],
      },
      cx as any,
    );
    expect(blankEdit.ok).toBe(false);
    if (blankEdit.ok) return;
    expect(blankEdit.error.code).toBe('VALIDATION_ERROR');
    expect(blankEdit.error.message).toMatch(/non-empty revised title/);

    const stillOriginal = await service.getRun('run-journey-edit-blank', cx as any);
    expect(stillOriginal.ok).toBe(true);
    if (!stillOriginal.ok) return;
    expect(stillOriginal.data.run.status).toBe('waiting_approval');
    expect(stillOriginal.data.state.pendingActions[0]?.payload['title']).toBe('Keep original');
    expect(port.resumeRun).not.toHaveBeenCalled();
  });


  it('fails closed on same-identity conversation rebinding of runId (residual 457)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-session' } as const;

    const first = await service.startRun(
      {
        runId: 'run-journey-session',
        threadId: 'thread-session-a',
        conversationId: 'conv-session-a',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Session A draft' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(first.ok).toBe(true);

    const rebind = await service.startRun(
      {
        runId: 'run-journey-session',
        threadId: 'thread-session-a',
        conversationId: 'conv-session-b',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Session B takeover' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(rebind.ok).toBe(false);
    if (rebind.ok) return;
    expect(rebind.error.code).toBe('VALIDATION_ERROR');
    expect(rebind.error.message).toMatch(/already bound to another conversation/);

    const listedA = await service.listRuns(
      { conversationId: 'conv-session-a', activeOnly: true },
      cx as any,
    );
    expect(listedA.ok).toBe(true);
    if (!listedA.ok) return;
    expect(listedA.data.some((run) => run.runId === 'run-journey-session')).toBe(true);

    const listedB = await service.listRuns(
      { conversationId: 'conv-session-b' },
      cx as any,
    );
    expect(listedB.ok).toBe(true);
    if (!listedB.ok) return;
    expect(listedB.data.some((run) => run.runId === 'run-journey-session')).toBe(false);

    const stillA = await service.getRun('run-journey-session', cx as any);
    expect(stillA.ok).toBe(true);
    if (!stillA.ok) return;
    expect(stillA.data.run.conversationId).toBe('conv-session-a');
    expect(stillA.data.state.pendingActions[0]?.payload['title']).toBe('Session A draft');
    expect(port.startRun).not.toHaveBeenCalled();
  });


  it('rejects missing conversationId at start without store registration (residual 461)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-conv' } as const;

    const rejected = await service.startRun(
      {
        runId: 'run-journey-no-conv',
        threadId: 'thread-journey-no-conv',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Needs conversation' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.error.code).toBe('VALIDATION_ERROR');
    expect(rejected.error.message).toMatch(/non-empty conversationId/);

    const listed = await service.listRuns({}, cx as any);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.some((run) => run.runId === 'run-journey-no-conv')).toBe(false);
    expect(port.startRun).not.toHaveBeenCalled();
  });


  it('confirm normalizes settlement title and fails closed without recoverable title (residual 463)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-title-settle' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-title-settle',
        threadId: 'thread-journey-title-settle',
        conversationId: 'conv-journey-title-settle',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Recoverable title' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started.ok).toBe(true);

    const completed = await service.resumeRun(
      'run-journey-title-settle',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-journey-title',
          },
        ],
      },
      cx as any,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.data.state.executedActions[0]?.data?.['title']).toBe('Recoverable title');
    expect(completed.data.events.at(-1)?.data?.['title']).toBe('Recoverable title');

    // Fresh run with blank title payload after edit is blocked by residual 455;
    // construct confirm without recoverable title by confirming after empty approvedActions wipe via edit fail path is unavailable.
    // Use a second start + confirm with approvedActions empty title override.
    const started2 = await service.startRun(
      {
        runId: 'run-journey-title-fail',
        threadId: 'thread-journey-title-fail',
        conversationId: 'conv-journey-title-fail',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Will be wiped' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started2.ok).toBe(true);

    const failConfirm = await service.resumeRun(
      'run-journey-title-fail',
      {
        userDecision: 'confirm',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'wipe',
            payload: {},
          },
        ],
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created without title',
          },
        ],
      },
      cx as any,
    );
    expect(failConfirm.ok).toBe(false);
    if (failConfirm.ok) return;
    expect(failConfirm.error.code).toBe('VALIDATION_ERROR');
    expect(failConfirm.error.message).toMatch(/non-empty settlement title/);

    const stillWaiting = await service.getRun('run-journey-title-fail', cx as any);
    expect(stillWaiting.ok).toBe(true);
    if (!stillWaiting.ok) return;
    expect(stillWaiting.data.run.status).toBe('waiting_approval');
    expect(port.resumeRun).not.toHaveBeenCalled();
  });

  it('confirm normalizes settlement template id and fails closed without recoverable id (residual 465)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-template-settle' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-template-settle',
        threadId: 'thread-journey-template-settle',
        conversationId: 'conv-journey-template-settle',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Template settle' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started.ok).toBe(true);

    const completed = await service.resumeRun(
      'run-journey-template-settle',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            data: { title: 'Template settle', templateId: 'tpl-journey-data' },
          },
        ],
      },
      cx as any,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.data.state.executedActions[0]?.entityId).toBe('tpl-journey-data');
    expect(completed.data.state.executedActions[0]?.data?.['templateId']).toBe('tpl-journey-data');
    expect(completed.data.events.at(-1)?.data?.['templateId']).toBe('tpl-journey-data');

    const started2 = await service.startRun(
      {
        runId: 'run-journey-template-fail',
        threadId: 'thread-journey-template-fail',
        conversationId: 'conv-journey-template-fail',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'No template id' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started2.ok).toBe(true);

    const failConfirm = await service.resumeRun(
      'run-journey-template-fail',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created without template id',
            data: { title: 'No template id' },
          },
        ],
      },
      cx as any,
    );
    expect(failConfirm.ok).toBe(false);
    if (failConfirm.ok) return;
    expect(failConfirm.error.code).toBe('VALIDATION_ERROR');
    expect(failConfirm.error.message).toMatch(/non-empty settlement template entity id/);

    const stillWaiting = await service.getRun('run-journey-template-fail', cx as any);
    expect(stillWaiting.ok).toBe(true);
    if (!stillWaiting.ok) return;
    expect(stillWaiting.data.run.status).toBe('waiting_approval');
    expect(port.resumeRun).not.toHaveBeenCalled();
  });

  it('confirm normalizes settlement goalId and fails closed on rebind (residual 467)', async () => {
    const port = makePort();
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'owner-goal-settle' } as const;

    const started = await service.startRun(
      {
        runId: 'run-journey-goal-settle',
        threadId: 'thread-journey-goal-settle',
        conversationId: 'conv-journey-goal-settle',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Goal settle', goalId: 'goal-approved' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started.ok).toBe(true);

    const completed = await service.resumeRun(
      'run-journey-goal-settle',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-journey-goal',
            data: { title: 'Goal settle' },
          },
        ],
      },
      cx as any,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.data.state.executedActions[0]?.data?.['goalId']).toBe('goal-approved');
    expect(completed.data.events.at(-1)?.data?.['goalId']).toBe('goal-approved');

    const started2 = await service.startRun(
      {
        runId: 'run-journey-goal-rebind',
        threadId: 'thread-journey-goal-rebind',
        conversationId: 'conv-journey-goal-rebind',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Goal rebind', goalId: 'goal-approved' },
        identityId: 'ignored',
      },
      cx as any,
    );
    expect(started2.ok).toBe(true);

    const failConfirm = await service.resumeRun(
      'run-journey-goal-rebind',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created with rebound goal',
            entityId: 'tpl-journey-rebind',
            data: { title: 'Goal rebind', goalId: 'goal-other' },
          },
        ],
      },
      cx as any,
    );
    expect(failConfirm.ok).toBe(false);
    if (failConfirm.ok) return;
    expect(failConfirm.error.code).toBe('VALIDATION_ERROR');
    expect(failConfirm.error.message).toMatch(/must not rebind settlement goalId/);

    const stillWaiting = await service.getRun('run-journey-goal-rebind', cx as any);
    expect(stillWaiting.ok).toBe(true);
    if (!stillWaiting.ok) return;
    expect(stillWaiting.data.run.status).toBe('waiting_approval');
    expect(port.resumeRun).not.toHaveBeenCalled();
  });

});
