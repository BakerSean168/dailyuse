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

describe('host-task-create-run-store identity binding (residual 451)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('fails closed when foreign identity tries to take over an existing runId', () => {
    const store = createHostTaskCreateRunStore();
    store.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-bound', 'Owned'),
        identityId: 'owner-1',
        nowMs: 10,
      }),
    );

    expect(() =>
      store.upsert(
        buildHostTaskCreateStartResult({
          request: request('run-bound', 'Intruder'),
          identityId: 'intruder',
          nowMs: 20,
        }),
      ),
    ).toThrow(/already bound to another identity/);

    expect(store.get('run-bound', 'owner-1')?.run.identityId).toBe('owner-1');
    expect(store.get('run-bound', 'intruder')).toBeNull();
    expect(store.list('owner-1')).toHaveLength(1);
    expect(store.list('intruder')).toHaveLength(0);
  });

  it('allows same-identity resume upsert and distinct runIds across identities', () => {
    const store = createHostTaskCreateRunStore();
    const owned = buildHostTaskCreateStartResult({
      request: request('run-same', 'Owned'),
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(owned);
    const revised = {
      ...owned,
      run: { ...owned.run, updatedAt: 30 },
    };
    store.upsert(revised);
    expect(store.get('run-same', 'owner-1')?.run.updatedAt).toBe(30);

    store.upsert(
      buildHostTaskCreateStartResult({
        request: request('run-other', 'Other'),
        identityId: 'owner-2',
        nowMs: 40,
      }),
    );
    expect(store.list('owner-1').map((run) => run.runId)).toEqual(['run-same']);
    expect(store.list('owner-2').map((run) => run.runId)).toEqual(['run-other']);
  });
});

describe('host-task-create-run-store conversation/thread binding (residual 457)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('fails closed when same identity rebinds runId to another conversation', () => {
    const store = createHostTaskCreateRunStore();
    store.upsert(
      buildHostTaskCreateStartResult({
        request: { ...request('run-conv', 'Owned'), conversationId: 'conv-a' },
        identityId: 'owner-1',
        nowMs: 10,
      }),
    );

    expect(() =>
      store.upsert(
        buildHostTaskCreateStartResult({
          request: { ...request('run-conv', 'Other conv'), conversationId: 'conv-b' },
          identityId: 'owner-1',
          nowMs: 20,
        }),
      ),
    ).toThrow(/already bound to another conversation/);

    expect(store.get('run-conv', 'owner-1')?.run.conversationId).toBe('conv-a');
    expect(store.list('owner-1', { conversationId: 'conv-a' })).toHaveLength(1);
    expect(store.list('owner-1', { conversationId: 'conv-b' })).toHaveLength(0);
  });

  it('fails closed when same identity rebinds runId to another thread', () => {
    const store = createHostTaskCreateRunStore();
    store.upsert(
      buildHostTaskCreateStartResult({
        request: { ...request('run-thread', 'Owned'), threadId: 'thread-a' },
        identityId: 'owner-1',
        nowMs: 10,
      }),
    );

    expect(() =>
      store.upsert(
        buildHostTaskCreateStartResult({
          request: { ...request('run-thread', 'Other thread'), threadId: 'thread-b' },
          identityId: 'owner-1',
          nowMs: 20,
        }),
      ),
    ).toThrow(/already bound to another thread/);

    expect(store.get('run-thread', 'owner-1')?.run.threadId).toBe('thread-a');
  });

  it('allows same-identity resume upsert with matching conversation/thread', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: {
        ...request('run-same-session', 'Owned'),
        conversationId: 'conv-1',
        threadId: 'thread-1',
      },
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);
    const updated = {
      ...started,
      run: { ...started.run, updatedAt: 30, status: 'cancelled' as const },
    };
    store.upsert(updated);
    expect(store.get('run-same-session', 'owner-1')?.run.status).toBe('cancelled');
    expect(store.get('run-same-session', 'owner-1')?.run.conversationId).toBe('conv-1');
  });

  it('activeOnly excludes terminal runs after cancel/complete (residual 457)', () => {
    const store = createHostTaskCreateRunStore();
    const waiting = buildHostTaskCreateStartResult({
      request: { ...request('run-active', 'Active'), conversationId: 'conv-1' },
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(waiting);
    expect(store.list('owner-1', { conversationId: 'conv-1', activeOnly: true })).toHaveLength(1);

    store.upsert({
      ...waiting,
      run: { ...waiting.run, status: 'completed', updatedAt: 20 },
    });
    expect(store.list('owner-1', { conversationId: 'conv-1', activeOnly: true })).toHaveLength(0);
    expect(store.list('owner-1', { conversationId: 'conv-1', status: ['completed'] })).toHaveLength(1);
  });
});

