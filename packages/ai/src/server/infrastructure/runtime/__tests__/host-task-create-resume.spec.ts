import { describe, expect, it } from 'vitest';
import { buildHostTaskCreateStartResult } from '../host-task-create-start';
import { buildHostTaskCreateResumeResult } from '../host-task-create-resume';
import type { AgentStartRunRequest } from '@dailyuse/contracts/ai';

function request(runId: string): AgentStartRunRequest {
  return {
    runId,
    threadId: `thread-${runId}`,
    conversationId: 'conv-1',
    identityId: 'identity-body',
    agentType: 'task.create',
    locale: 'en-US',
    input: { title: 'Ship residual 437' },
  };
}

describe('host-task-create-resume (residual 437)', () => {
  it('cancel moves waiting_approval to cancelled and clears interrupts', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-cancel'),
      identityId: 'id-1',
      nowMs: 10,
    });
    const cancelled = buildHostTaskCreateResumeResult({
      current: started,
      payload: { userDecision: 'cancel' },
      nowMs: 20,
    });
    expect(cancelled.run.status).toBe('cancelled');
    expect(cancelled.run.updatedAt).toBe(20);
    expect(cancelled.state.pendingActions).toEqual([]);
    expect(cancelled.interrupts).toEqual([]);
    expect(cancelled.events.at(-1)?.type).toBe('run.completed');
    expect(cancelled.events.at(-1)?.data?.['userDecision']).toBe('cancel');
  });

  it('confirm records executedActions and completes without pending approval', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-complete'),
      identityId: 'id-1',
      nowMs: 10,
    });
    const completed = buildHostTaskCreateResumeResult({
      current: started,
      payload: {
        userDecision: 'confirm',
        executedActions: [
          {
            tool: 'create_task_template',
            status: 'executed',
            message: 'Created task template',
            entityId: 'tpl-1',
          },
        ],
      },
      nowMs: 30,
    });
    expect(completed.run.status).toBe('completed');
    expect(completed.state.pendingActions).toEqual([]);
    expect(completed.state.executedActions).toHaveLength(1);
    expect(completed.state.executedActions[0]?.entityId).toBe('tpl-1');
    expect(completed.interrupts).toEqual([]);
  });

  it('fails closed for unsupported userDecision', () => {
    const started = buildHostTaskCreateStartResult({
      request: request('run-bad'),
      identityId: 'id-1',
      nowMs: 1,
    });
    expect(() =>
      buildHostTaskCreateResumeResult({
        current: started,
        payload: { userDecision: 'clarify', clarificationAnswers: ['x'] },
      }),
    ).toThrow(/does not support userDecision/);
  });
});
