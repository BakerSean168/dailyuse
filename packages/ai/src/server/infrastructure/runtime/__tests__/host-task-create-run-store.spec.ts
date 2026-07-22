import { describe, expect, it, beforeEach } from 'vitest';
import {
  createHostTaskCreateRunStore,
  resetDefaultHostTaskCreateRunStoreForTests,
  getDefaultHostTaskCreateRunStore,
} from '../host-task-create-run-store';
import { buildHostTaskCreateStartResult } from '../host-task-create-start';
import type { AgentStartRunRequest } from '@dailyuse/contracts/ai';

function request(runId: string, title: string): AgentStartRunRequest {
  return {
    runId,
    threadId: `thread-${runId}`,
    conversationId: 'conv-1',
    identityId: 'identity-body',
    agentType: 'task.create',
    locale: 'en-US',
    input: { title },
  };
}

describe('host-task-create-run-store (residual 435)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('upserts and returns owned task.create runs only', () => {
    const store = createHostTaskCreateRunStore();
    const result = buildHostTaskCreateStartResult({
      request: request('run-a', 'Task A'),
      identityId: 'id-1',
      nowMs: 10,
    });
    store.upsert(result);

    expect(store.get('run-a', 'id-1')?.run.runId).toBe('run-a');
    expect(store.get('run-a', 'id-other')).toBeNull();
    expect(store.getEvents('run-a', 'id-1')?.[0]?.type).toBe('approval.required');
    expect(store.list('id-1')).toHaveLength(1);
    expect(store.list('id-1', { status: ['waiting_approval'] })).toHaveLength(1);
    expect(store.list('id-1', { status: ['completed'] })).toHaveLength(0);
  });

  it('default process store is shared for runtime composition', () => {
    const a = getDefaultHostTaskCreateRunStore();
    const b = getDefaultHostTaskCreateRunStore();
    expect(a).toBe(b);
    a.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-shared', 'Shared'),
        identityId: 'id-1',
        nowMs: 1,
      }),
    );
    expect(b.size()).toBe(1);
  });
});
