import { describe, expect, it } from 'vitest';
import {
  buildHostTaskCreateStartResult,
  resolveTaskCreateTitle,
  resolveTaskCreateGoalId,
  resolveTaskCreateConversationId,
  HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE,
  HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE,
  resolveTaskCreateThreadId,
  resolveTaskCreateIdentityId,
  resolveTaskCreateRunId,
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

describe('host-task-create-start conversation binding (residual 461)', () => {
  it('resolveTaskCreateConversationId trims and rejects empty', () => {
    expect(resolveTaskCreateConversationId('  conv-1  ')).toBe('conv-1');
    expect(resolveTaskCreateConversationId('')).toBeUndefined();
    expect(resolveTaskCreateConversationId(null)).toBeUndefined();
    expect(resolveTaskCreateConversationId(undefined)).toBeUndefined();
    expect(HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE).toMatch(/conversationId/);
  });
});

describe('host-task-create-start title fail-closed (residual 479)', () => {
  it('buildHostTaskCreateStartResult throws without inventing a default title', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: baseRequest({ title: '   ' }),
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE);

    expect(() =>
      buildHostTaskCreateStartResult({
        request: baseRequest({}),
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(/non-empty title/);

    expect(HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE).toMatch(/title, idea, message/);
  });

  it('accepts idea/message/conversationTitle as recoverable start title', () => {
    const fromIdea = buildHostTaskCreateStartResult({
      request: baseRequest({ idea: '  From idea  ' }),
      identityId: 'identity-server',
      nowMs: 1000,
    });
    expect(fromIdea.state.pendingActions[0]?.payload['title']).toBe('From idea');

    const fromMessage = buildHostTaskCreateStartResult({
      request: baseRequest({ message: 'From message' }),
      identityId: 'identity-server',
      nowMs: 2000,
    });
    expect(fromMessage.state.pendingActions[0]?.payload['title']).toBe('From message');
  });
});

describe('host-task-create-start conversationId fail-closed (residual 483)', () => {
  it('buildHostTaskCreateStartResult throws without inventing null conversationId', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Needs conversation' }), conversationId: '' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE);

    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Needs conversation' }), conversationId: '   ' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(/non-empty conversationId/);

    const ok = buildHostTaskCreateStartResult({
      request: { ...baseRequest({ title: 'Bound' }), conversationId: '  conv-trim  ' },
      identityId: 'identity-server',
      nowMs: 1000,
    });
    expect(ok.run.conversationId).toBe('conv-trim');
  });
});

describe('host-task-create-start threadId fail-closed (residual 485)', () => {
  it('resolveTaskCreateThreadId trims and rejects empty', () => {
    expect(resolveTaskCreateThreadId('  thread-1  ')).toBe('thread-1');
    expect(resolveTaskCreateThreadId('')).toBeUndefined();
    expect(resolveTaskCreateThreadId('   ')).toBeUndefined();
    expect(resolveTaskCreateThreadId(null)).toBeUndefined();
    expect(HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE).toMatch(/threadId/);
  });

  it('buildHostTaskCreateStartResult throws without inventing blank threadId', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Needs thread' }), threadId: '   ' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE);

    const ok = buildHostTaskCreateStartResult({
      request: { ...baseRequest({ title: 'Bound' }), threadId: '  thread-trim  ' },
      identityId: 'identity-server',
      nowMs: 1000,
    });
    expect(ok.run.threadId).toBe('thread-trim');
    expect(ok.interrupts[0]?.threadId).toBe('thread-trim');
  });
});

describe('host-task-create-start identityId fail-closed (residual 493)', () => {
  it('resolveTaskCreateIdentityId trims and rejects empty', () => {
    expect(resolveTaskCreateIdentityId('  identity-1  ')).toBe('identity-1');
    expect(resolveTaskCreateIdentityId('')).toBeUndefined();
    expect(resolveTaskCreateIdentityId('   ')).toBeUndefined();
    expect(resolveTaskCreateIdentityId(null)).toBeUndefined();
    expect(resolveTaskCreateIdentityId(undefined)).toBeUndefined();
    expect(HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE).toMatch(/identityId/);
  });

  it('buildHostTaskCreateStartResult throws without inventing blank identityId', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: baseRequest({ title: 'Needs identity' }),
        identityId: '   ',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE);

    expect(() =>
      buildHostTaskCreateStartResult({
        request: baseRequest({ title: 'Needs identity' }),
        identityId: '',
        nowMs: 1000,
      }),
    ).toThrow(/non-empty identityId/);

    const ok = buildHostTaskCreateStartResult({
      request: baseRequest({ title: 'Bound' }),
      identityId: '  identity-trim  ',
      nowMs: 1000,
    });
    expect(ok.run.identityId).toBe('identity-trim');
  });
});

describe('host-task-create-start runId fail-closed (residual 497)', () => {
  it('resolveTaskCreateRunId trims and rejects empty', () => {
    expect(resolveTaskCreateRunId('  run-1  ')).toBe('run-1');
    expect(resolveTaskCreateRunId('')).toBeUndefined();
    expect(resolveTaskCreateRunId('   ')).toBeUndefined();
    expect(resolveTaskCreateRunId(null)).toBeUndefined();
    expect(resolveTaskCreateRunId(undefined)).toBeUndefined();
    expect(HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE).toMatch(/runId/);
  });

  it('buildHostTaskCreateStartResult throws without inventing blank runId', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Needs runId' }), runId: '   ' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE);

    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Needs runId' }), runId: '' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(/non-empty runId/);

    const ok = buildHostTaskCreateStartResult({
      request: { ...baseRequest({ title: 'Bound' }), runId: '  run-trim  ' },
      identityId: 'identity-server',
      nowMs: 1000,
    });
    expect(ok.run.runId).toBe('run-trim');
    expect(ok.interrupts[0]?.runId).toBe('run-trim');
    expect(ok.events[0]?.runId).toBe('run-trim');
  });
});

describe('host-task-create-start agentType fail-closed (residual 499)', () => {
  it('buildHostTaskCreateStartResult rejects non-task.create agentType without silent retype', () => {
    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Wrong agent' }), agentType: 'goal.create' },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE);

    expect(() =>
      buildHostTaskCreateStartResult({
        request: { ...baseRequest({ title: 'Wrong agent' }), agentType: 'knowledge.generate' as any },
        identityId: 'identity-server',
        nowMs: 1000,
      }),
    ).toThrow(/agentType task\.create/);

    const ok = buildHostTaskCreateStartResult({
      request: baseRequest({ title: 'Correct agent' }),
      identityId: 'identity-server',
      nowMs: 1000,
    });
    expect(ok.run.agentType).toBe('task.create');
    expect(HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE).toMatch(/task\.create/);
  });
});

