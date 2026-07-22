import { describe, expect, it, beforeEach } from 'vitest';
import {
  createHostTaskCreateRunStore,
  resetDefaultHostTaskCreateRunStoreForTests,
  getDefaultHostTaskCreateRunStore,
  HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE,
  HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE,
  HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE,
  HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE,
  matchesHostTaskCreateIdentity,
  matchesHostTaskCreateConversation,
  matchesHostTaskCreateThread,
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

describe('host-task-create-run-store agentType fail-closed (residual 495)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('rejects non-task.create upsert without silent ignore', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-foreign-agent', 'Should not store'),
      identityId: 'id-1',
      nowMs: 1,
    });
    const foreign = {
      ...started,
      run: { ...started.run, agentType: 'goal.create' as const },
    };
    expect(() => store.upsert(foreign as typeof started)).toThrow(
      HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE,
    );
    expect(store.size()).toBe(0);
    expect(store.get('run-foreign-agent', 'id-1')).toBeNull();
    expect(HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE).toMatch(/task\.create/);
  });
});

describe('host-task-create-run-store identity trim match (residual 503)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('matchesHostTaskCreateIdentity trims and rejects empty', () => {
    expect(matchesHostTaskCreateIdentity('id-1', '  id-1  ')).toBe(true);
    expect(matchesHostTaskCreateIdentity('  id-1  ', 'id-1')).toBe(true);
    expect(matchesHostTaskCreateIdentity('id-1', 'id-2')).toBe(false);
    expect(matchesHostTaskCreateIdentity('id-1', '   ')).toBe(false);
    expect(matchesHostTaskCreateIdentity('id-1', '')).toBe(false);
  });

  it('get/list/getEvents honor trimmed identity query without false isolation miss', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-trim-id', 'Trim identity'),
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);

    expect(store.get('run-trim-id', '  owner-1  ')?.run.runId).toBe('run-trim-id');
    expect(store.getEvents('run-trim-id', ' owner-1 ')?.length).toBeGreaterThan(0);
    expect(store.list('  owner-1  ').some((run) => run.runId === 'run-trim-id')).toBe(true);

    // blank / foreign still fail-closed
    expect(store.get('run-trim-id', '   ')).toBeNull();
    expect(store.get('run-trim-id', 'intruder')).toBeNull();
    expect(store.list('   ')).toHaveLength(0);
  });

  it('upsert foreign takeover still fail-closed across whitespace-equivalent ids only', () => {
    const store = createHostTaskCreateRunStore();
    const owned = buildHostTaskCreateStartResult({
      request: request('run-bound', 'Owned'),
      identityId: 'owner-1',
      nowMs: 1,
    });
    store.upsert(owned);

    // same identity with surrounding whitespace must not count as foreign takeover
    const sameOwnerSpaced = {
      ...owned,
      run: { ...owned.run, identityId: '  owner-1  ', updatedAt: 2 },
    };
    expect(() => store.upsert(sameOwnerSpaced as typeof owned)).not.toThrow();

    const foreign = {
      ...owned,
      run: { ...owned.run, identityId: 'other-owner', updatedAt: 3 },
    };
    expect(() => store.upsert(foreign as typeof owned)).toThrow(
      /already bound to another identity/,
    );
  });
});

describe('host-task-create-run-store runId trim lookup (residual 505)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('get/getEvents honor trimmed runId query without false isolation miss', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-trim-key', 'Trim runId'),
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);

    expect(store.get('  run-trim-key  ', 'owner-1')?.run.runId).toBe('run-trim-key');
    expect(store.getEvents(' run-trim-key ', 'owner-1')?.[0]?.runId).toBe('run-trim-key');
    // blank runId still fail-closed
    expect(store.get('   ', 'owner-1')).toBeNull();
    expect(store.get('', 'owner-1')).toBeNull();
    expect(store.getEvents('   ', 'owner-1')).toBeNull();
  });

  it('upsert normalizes spaced runId to one map key and keeps identity binding', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-space-key', 'Owned'),
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);

    const spacedSame = {
      ...started,
      run: { ...started.run, runId: '  run-space-key  ', updatedAt: 20 },
    };
    expect(() => store.upsert(spacedSame as typeof started)).not.toThrow();
    expect(store.size()).toBe(1);
    expect(store.get('run-space-key', 'owner-1')?.run.updatedAt).toBe(20);
    expect(store.get('  run-space-key  ', 'owner-1')?.run.runId).toBe('run-space-key');

    const foreignSpaced = {
      ...started,
      run: {
        ...started.run,
        runId: ' run-space-key ',
        identityId: 'intruder',
        updatedAt: 30,
      },
    };
    expect(() => store.upsert(foreignSpaced as typeof started)).toThrow(
      /already bound to another identity/,
    );
  });

  it('upsert rejects blank runId fail-closed', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-blank-key', 'Blank'),
      identityId: 'owner-1',
      nowMs: 1,
    });
    const blank = {
      ...started,
      run: { ...started.run, runId: '   ' },
    };
    expect(() => store.upsert(blank as typeof started)).toThrow(
      HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE,
    );
    expect(store.size()).toBe(0);
    expect(HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE).toMatch(/runId/);
  });
});

describe('host-task-create-run-store conversationId trim match (residual 509)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('matchesHostTaskCreateConversation trims and rejects empty', () => {
    expect(matchesHostTaskCreateConversation('conv-1', '  conv-1  ')).toBe(true);
    expect(matchesHostTaskCreateConversation('  conv-1  ', 'conv-1')).toBe(true);
    expect(matchesHostTaskCreateConversation('conv-1', 'conv-2')).toBe(false);
    expect(matchesHostTaskCreateConversation('conv-1', '   ')).toBe(false);
    expect(matchesHostTaskCreateConversation('conv-1', '')).toBe(false);
    expect(matchesHostTaskCreateConversation(null, 'conv-1')).toBe(false);
  });

  it('list honors trimmed conversationId without false isolation miss', () => {
    const store = createHostTaskCreateRunStore();
    store.upsert(
      buildHostTaskCreateStartResult({
        request: { ...request('run-conv-trim', 'Trim conv'), conversationId: 'conv-trim' },
        identityId: 'owner-1',
        nowMs: 10,
      }),
    );

    expect(store.list('owner-1', { conversationId: '  conv-trim  ' })).toHaveLength(1);
    expect(store.list('owner-1', { conversationId: 'conv-trim' })[0]?.runId).toBe('run-conv-trim');
    // blank filter fails closed (matches nothing, not unfiltered)
    expect(store.list('owner-1', { conversationId: '   ' })).toHaveLength(0);
    expect(store.list('owner-1', { conversationId: '' })).toHaveLength(0);
    expect(store.list('owner-1', { conversationId: 'other' })).toHaveLength(0);
  });

  it('upsert conversation rebind still fail-closed across whitespace-equivalent ids only', () => {
    const store = createHostTaskCreateRunStore();
    const owned = buildHostTaskCreateStartResult({
      request: { ...request('run-conv-bound', 'Owned'), conversationId: 'conv-a' },
      identityId: 'owner-1',
      nowMs: 1,
    });
    store.upsert(owned);

    const sameConvSpaced = {
      ...owned,
      run: { ...owned.run, conversationId: '  conv-a  ', updatedAt: 2 },
    };
    expect(() => store.upsert(sameConvSpaced as typeof owned)).not.toThrow();

    const other = {
      ...owned,
      run: { ...owned.run, conversationId: 'conv-b', updatedAt: 3 },
    };
    expect(() => store.upsert(other as typeof owned)).toThrow(
      /already bound to another conversation/,
    );
  });
});

describe('host-task-create-run-store threadId trim match (residual 511)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('matchesHostTaskCreateThread trims and rejects empty', () => {
    expect(matchesHostTaskCreateThread('thread-1', '  thread-1  ')).toBe(true);
    expect(matchesHostTaskCreateThread('  thread-1  ', 'thread-1')).toBe(true);
    expect(matchesHostTaskCreateThread('thread-1', 'thread-2')).toBe(false);
    expect(matchesHostTaskCreateThread('thread-1', '   ')).toBe(false);
    expect(matchesHostTaskCreateThread('thread-1', '')).toBe(false);
    expect(matchesHostTaskCreateThread(null, 'thread-1')).toBe(false);
  });

  it('upsert normalizes spaced threadId and keeps thread binding', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: { ...request('run-thread-trim', 'Owned'), threadId: 'thread-trim' },
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);

    const spacedSame = {
      ...started,
      run: { ...started.run, threadId: '  thread-trim  ', updatedAt: 20 },
    };
    expect(() => store.upsert(spacedSame as typeof started)).not.toThrow();
    expect(store.get('run-thread-trim', 'owner-1')?.run.threadId).toBe('thread-trim');
    expect(store.get('run-thread-trim', 'owner-1')?.run.updatedAt).toBe(20);

    const other = {
      ...started,
      run: { ...started.run, threadId: 'thread-other', updatedAt: 30 },
    };
    expect(() => store.upsert(other as typeof started)).toThrow(
      /already bound to another thread/,
    );
  });

  it('upsert rejects blank threadId fail-closed', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-blank-thread', 'Blank thread'),
      identityId: 'owner-1',
      nowMs: 1,
    });
    const blank = {
      ...started,
      run: { ...started.run, threadId: '   ' },
    };
    expect(() => store.upsert(blank as typeof started)).toThrow(
      HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE,
    );
    expect(store.size()).toBe(0);
    expect(HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE).toMatch(/threadId/);
  });
});

describe('host-task-create-run-store conversationId upsert normalize (residual 513)', () => {
  beforeEach(() => {
    resetDefaultHostTaskCreateRunStoreForTests();
  });

  it('upsert normalizes spaced conversationId and keeps binding', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: { ...request('run-conv-norm', 'Owned'), conversationId: 'conv-norm' },
      identityId: 'owner-1',
      nowMs: 10,
    });
    store.upsert(started);

    const spacedSame = {
      ...started,
      run: { ...started.run, conversationId: '  conv-norm  ', updatedAt: 20 },
    };
    expect(() => store.upsert(spacedSame as typeof started)).not.toThrow();
    expect(store.get('run-conv-norm', 'owner-1')?.run.conversationId).toBe('conv-norm');
    expect(store.get('run-conv-norm', 'owner-1')?.run.updatedAt).toBe(20);
  });

  it('upsert rejects blank conversationId fail-closed', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-blank-conv', 'Blank conv'),
      identityId: 'owner-1',
      nowMs: 1,
    });
    const blank = {
      ...started,
      run: { ...started.run, conversationId: '   ' },
    };
    expect(() => store.upsert(blank as typeof started)).toThrow(
      HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE,
    );
    expect(store.size()).toBe(0);
    expect(HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE).toMatch(/conversationId/);
  });

  it('upsert rejects null conversationId fail-closed', () => {
    const store = createHostTaskCreateRunStore();
    const started = buildHostTaskCreateStartResult({
      request: request('run-null-conv', 'Null conv'),
      identityId: 'owner-1',
      nowMs: 1,
    });
    const nulled = {
      ...started,
      run: { ...started.run, conversationId: null },
    };
    expect(() => store.upsert(nulled as typeof started)).toThrow(
      HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE,
    );
    expect(store.size()).toBe(0);
  });
});
