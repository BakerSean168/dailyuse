/**
 * Residual 435: task.create start registers process-local store; getRun/listRuns rehydrate.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createAgentRuntimeService } from '../ai-runtime';
import { resetDefaultHostTaskCreateRunStoreForTests } from '../host-task-create-run-store';
import type { IAgentRuntimePort } from '../../../application/ports/agent-runtime.port';

describe('host task.create process-local store runtime wire (residual 435)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('startRun(task.create) is gettable/listable without Python port hit', async () => {
    const port: IAgentRuntimePort = {
      startRun: vi.fn(),
      resumeRun: vi.fn(),
      getRun: vi.fn().mockRejectedValue(new Error('should not call port.getRun for stored task')),
      listRuns: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockRejectedValue(new Error('should not call port.getEvents for stored task')),
    };

    const service = createAgentRuntimeService(port);
    const cx = { identityId: 'identity-1' } as const;

    const started = await service.startRun(
      {
        runId: 'run-task-store-1',
        threadId: 'thread-task-store-1',
        conversationId: 'conv-1',
        identityId: 'identity-should-be-overridden',
        agentType: 'task.create',
        locale: 'en-US',
        input: { title: 'Stored task', goalId: 'goal-1' },
      },
      cx as any,
      'req-1',
    );

    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.data.run.identityId).toBe('identity-1');
    expect(port.startRun).not.toHaveBeenCalled();

    const got = await service.getRun('run-task-store-1', cx as any, 'req-2');
    expect(got.ok).toBe(true);
    if (!got.ok) return;
    expect(got.data.run.runId).toBe('run-task-store-1');
    expect(got.data.state.pendingActions[0]?.tool).toBe('create_task_template');
    expect(port.getRun).not.toHaveBeenCalled();

    const listed = await service.listRuns({ conversationId: 'conv-1' }, cx as any, 'req-3');
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.some((run) => run.runId === 'run-task-store-1')).toBe(true);

    const events = await service.getEvents('run-task-store-1', cx as any, 'req-4');
    expect(events.ok).toBe(true);
    if (!events.ok) return;
    expect(events.data[0]?.type).toBe('approval.required');
    expect(port.getEvents).not.toHaveBeenCalled();
  });

  it('getRun fails closed across identity boundary for stored task.create runs', async () => {
    const port: IAgentRuntimePort = {
      startRun: vi.fn(),
      resumeRun: vi.fn(),
      getRun: vi.fn().mockRejectedValue(new Error('missing')),
      listRuns: vi.fn().mockResolvedValue([]),
      getEvents: vi.fn().mockResolvedValue([]),
    };
    const service = createAgentRuntimeService(port);

    const started = await service.startRun(
      {
        runId: 'run-task-store-2',
        threadId: 'thread-task-store-2',
        agentType: 'task.create',
        locale: 'zh-CN',
        input: { idea: 'Cross identity' },
        identityId: 'ignored',
      },
      { identityId: 'owner-1' } as any,
    );
    expect(started.ok).toBe(true);

    // Store returns null for other identity; falls through to port (mock rejects).
    await expect(
      service.getRun('run-task-store-2', { identityId: 'intruder' } as any),
    ).rejects.toThrow('missing');
  });
});
