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

describe('host-task-create-run-store bound (residual 447)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('evicts oldest updatedAt entries when maxEntries is exceeded', () => {
    const store = createHostTaskCreateRunStore({ maxEntries: 3 });
    for (let i = 1; i <= 4; i += 1) {
      store.upsert(
        buildHostTaskCreateStartResult({
          request: request(`run-${i}`, `Task ${i}`),
          identityId: 'id-1',
          nowMs: i * 10,
        }),
      );
    }
    expect(store.size()).toBe(3);
    expect(store.get('run-1', 'id-1')).toBeNull();
    expect(store.get('run-2', 'id-1')?.run.runId).toBe('run-2');
    expect(store.get('run-3', 'id-1')?.run.runId).toBe('run-3');
    expect(store.get('run-4', 'id-1')?.run.runId).toBe('run-4');
  });

  it('keeps refreshed runs when updatedAt is newer than peers', () => {
    const store = createHostTaskCreateRunStore({ maxEntries: 2 });
    const first = buildHostTaskCreateStartResult({
      request: request('run-keep', 'Keep me'),
      identityId: 'id-1',
      nowMs: 10,
    });
    store.upsert(first);
    store.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-old', 'Old'),
        identityId: 'id-1',
        nowMs: 20,
      }),
    );
    // Refresh first run with newer updatedAt via re-upsert of same runId.
    store.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-keep', 'Keep me updated'),
        identityId: 'id-1',
        nowMs: 30,
      }),
    );
    store.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-new', 'New'),
        identityId: 'id-1',
        nowMs: 40,
      }),
    );
    expect(store.size()).toBe(2);
    expect(store.get('run-old', 'id-1')).toBeNull();
    expect(store.get('run-keep', 'id-1')?.run.updatedAt).toBe(30);
    expect(store.get('run-new', 'id-1')?.run.runId).toBe('run-new');
  });
});
