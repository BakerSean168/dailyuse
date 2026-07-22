/**
 * Residual 437: task.create resume cancel/complete updates process-local store.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createAgentRuntimeService } from '../ai-runtime';
import { resetDefaultHostTaskCreateRunStoreForTests } from '../host-task-create-run-store';
import type { IAgentRuntimePort } from '../../../application/ports/agent-runtime.port';

describe('host task.create process-local resume runtime wire (residual 437/439)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('resume cancel/complete updates store without Python port', async () => {
    const port: IAgentRuntimePort = {
      startRun: vi.fn(),
      resumeRun: vi.fn().mockRejectedValue(new Error('should not call port.resumeRun')),
      getRun: vi.fn().mockRejectedValue(new Error('should not call port.getRun for stored task')),
      listRuns: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
    };

    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'identity-1' } as const;

    const started = await service.startRun(
      {
        runId: 'run-task-resume-1',
        threadId: 'thread-task-resume-1',
        conversationId: 'conv-1',
        identityId: 'ignored',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Cancel me' },
      },
      cx as any,
    );
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const cancelled = await service.resumeRun(
      'run-task-resume-1',
      { userDecision: 'cancel' },
      cx as any,
      'req-cancel',
    );
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.run.status).toBe('cancelled');
    expect(port.resumeRun).not.toHaveBeenCalled();

    const gotCancelled = await service.getRun('run-task-resume-1', cx as any);
    expect(gotCancelled.ok).toBe(true);
    if (!gotCancelled.ok) return;
    expect(gotCancelled.data.run.status).toBe('cancelled');

    // Fresh run for confirm path
    const started2 = await service.startRun(
      {
        runId: 'run-task-resume-2',
        threadId: 'thread-task-resume-2',
        conversationId: 'conv-1',
        identityId: 'ignored',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Complete me' },
      },
      cx as any,
    );
    expect(started2.ok).toBe(true);

    const completed = await service.resumeRun(
      'run-task-resume-2',
      {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created',
            entityId: 'tpl-9',
          },
        ],
      },
      cx as any,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.data.run.status).toBe('completed');
    expect(completed.data.state.executedActions[0]?.entityId).toBe('tpl-9');
    expect(port.resumeRun).not.toHaveBeenCalled();

    const listed = await service.listRuns(
      { conversationId: 'conv-1', status: ['completed'] },
      cx as any,
    );
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.some((run) => run.runId === 'run-task-resume-2')).toBe(true);
  });

  it('resume unsupported decision fails closed without port', async () => {
    const port: IAgentRuntimePort = {
      startRun: vi.fn(),
      resumeRun: vi.fn(),
      getRun: vi.fn(),
      listRuns: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
    };
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'identity-1' } as const;
    await service.startRun(
      {
        runId: 'run-task-resume-3',
        threadId: 'thread-task-resume-3',
        conversationId: 'conv-1',
        agentType: 'task.create',
        locale: 'zh-CN',
        input: { idea: 'no clarify' },
        identityId: 'ignored',
      },
      cx as any,
    );

    const clarified = await service.resumeRun(
      'run-task-resume-3',
      { userDecision: 'clarify', clarificationAnswers: ['x'] },
      cx as any,
    );
    expect(clarified.ok).toBe(false);
    if (clarified.ok) return;
    expect(clarified.error.code).toBe('VALIDATION_ERROR');
    expect(port.resumeRun).not.toHaveBeenCalled();
  });

  it('edit revises stored pending payload without port; cancel stays idempotent', async () => {
    const port: IAgentRuntimePort = {
      startRun: vi.fn(),
      resumeRun: vi.fn().mockRejectedValue(new Error('should not call port.resumeRun')),
      getRun: vi.fn().mockRejectedValue(new Error('should not call port.getRun')),
      listRuns: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
    };
    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'identity-1' } as const;

    await service.startRun(
      {
        runId: 'run-task-edit-1',
        threadId: 'thread-task-edit-1',
        conversationId: 'conv-1',
        identityId: 'ignored',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Draft A' },
      },
      cx as any,
    );

    const edited = await service.resumeRun(
      'run-task-edit-1',
      {
        userDecision: 'edit',
        approvedActions: [
          {
            tool: 'create_task_template',
            index: 0,
            dependsOn: [],
            rationale: 'rev',
            payload: { title: 'Draft B', goalId: 'g-1' },
          },
        ],
      },
      cx as any,
    );
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.data.run.status).toBe('waiting_approval');
    expect(edited.data.state.pendingActions[0]?.payload['title']).toBe('Draft B');
    expect(port.resumeRun).not.toHaveBeenCalled();

    const cancelled = await service.resumeRun(
      'run-task-edit-1',
      { userDecision: 'cancel' },
      cx as any,
    );
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.run.status).toBe('cancelled');

    const cancelledAgain = await service.resumeRun(
      'run-task-edit-1',
      { userDecision: 'cancel' },
      cx as any,
    );
    expect(cancelledAgain.ok).toBe(true);
    if (!cancelledAgain.ok) return;
    expect(cancelledAgain.data.run.status).toBe('cancelled');
    expect(cancelledAgain.data.events.filter((e) => e.data?.['userDecision'] === 'cancel')).toHaveLength(1);
  });

});
