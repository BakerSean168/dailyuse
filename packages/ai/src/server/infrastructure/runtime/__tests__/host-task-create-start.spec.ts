import { describe, expect, it } from 'vitest';
import {
  buildHostTaskCreateStartResult,
  resolveTaskCreateGoalId,
  resolveTaskCreateTitle,
} from '../host-task-create-start';
import type { AgentStartRunRequest } from '@dailyuse/contracts/ai';

function baseRequest(
  input: Record<string, unknown>,
): AgentStartRunRequest {
  return {
    runId: 'run-task-1',
    threadId: 'thread-task-1',
    conversationId: 'conv-1',
    identityId: 'identity-should-be-overridden',
    agentType: 'task.create',
    locale: 'en-US',
    input,
  };
}

describe('host-task-create-start (residual 431)', () => {
  it('resolves title and optional goalId from start input', () => {
    expect(resolveTaskCreateTitle({ title: ' Ship task ' })).toBe('Ship task');
    expect(resolveTaskCreateTitle({ idea: 'From idea' })).toBe('From idea');
    expect(resolveTaskCreateGoalId({ goalId: 'goal-9' })).toBe('goal-9');
    expect(resolveTaskCreateGoalId({})).toBeNull();
  });

  it('builds waiting_approval task.create Host proposal result from ExecutionContext identity', () => {
    const result = buildHostTaskCreateStartResult({
      request: baseRequest({ title: 'Ship Host Task', goalId: 'goal-1' }),
      identityId: 'identity-server',
      nowMs: 1000,
    });

    expect(result.run.agentType).toBe('task.create');
    expect(result.run.identityId).toBe('identity-server');
    expect(result.run.status).toBe('waiting_approval');
    expect(result.state.intent).toBe('task-create');
    expect(result.state.pendingActions).toHaveLength(1);
    expect(result.state.pendingActions[0]).toMatchObject({
      tool: 'create_task_template',
      index: 0,
      payload: { title: 'Ship Host Task', goalId: 'goal-1' },
    });
    expect(result.events[0]?.type).toBe('approval.required');
  });
});
