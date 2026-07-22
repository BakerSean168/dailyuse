/**
 * Residual 449: Host task.create process-local product journey (still partial for §13.2).
 *
 * Same-process fixture chain:
 *   start → store → edit → cancel
 *   start → confirm settle → get/list/events rehydrate
 *   identity fail-closed
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
});
