/**
 * Residual 435/447/451/457/495/503/505/509/511/513/515: process-local Host task.create run store foundation.
 *
 * TS task.create start (residual 431) does not hit Python LangGraph checkpointers.
 * This registry keeps started results for getRun/listRuns/getEvents within the
 * same AI runtime process so conversation restore can rehydrate beyond client
 * localStorage alone. Not a cross-process durable database.
 *
 * Residual 447: bound store size per process (evict oldest updatedAt first) so
 * long-lived API workers cannot grow unbounded from task.create Host traffic.
 *
 * Residual 451: runId is identity-bound — foreign identity cannot upsert/take over
 * an existing process-local task.create entry (fail-closed Agent isolation).
 *
 * Residual 457: runId is conversation/thread-bound — same identity cannot rebind an
 * existing runId to a different conversation or thread (session isolation).
 *
 * Residual 495: upsert rejects non-task.create agentType (no silent ignore).
 *
 * Residual 503: identity match uses trimmed non-empty identity (start residual 493
 * symmetry) so whitespace query/stored identity cannot isolate false-negative miss
 * or false-positive foreign accept.
 *
 * Residual 505: map key uses trimmed non-empty runId (start residual 497 symmetry)
 * so whitespace get/upsert cannot false-miss or invent a second key for one run.
 *
 * Residual 509: list conversationId filter uses trimmed non-empty conversationId
 * (start residual 483/461 symmetry) so whitespace query cannot false-miss session runs;
 * blank conversationId filter fails closed (matches nothing).
 *
 * Residual 511: thread binding uses trimmed non-empty threadId (start residual 485
 * symmetry) so whitespace upsert cannot false-rebind or invent a second thread key;
 * blank threadId on upsert fails closed.
 *
 * Residual 513: conversationId on upsert is trimmed non-empty (start residual 483
 * symmetry) and stored normalized; blank conversationId on upsert fails closed.
 *
 * Residual 515: identityId on upsert is trimmed non-empty (start residual 493
 * symmetry) and stored normalized; blank identityId on upsert fails closed.
 */

import type { AgentEvent, AgentRun, AgentRunListParams, AgentRunResult } from '@memoflow/contracts/ai';
import {
  resolveTaskCreateConversationId,
  resolveTaskCreateIdentityId,
  resolveTaskCreateRunId,
  resolveTaskCreateThreadId,
} from './host-task-create-start';

const ACTIVE_STATUSES = new Set([
  'pending',
  'running',
  'waiting_clarification',
  'waiting_approval',
  'waiting_execution',
]);

/** Residual 447: process-local task.create run cap (not a durable retention policy). */
export const HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES = 64;

/** Residual 451: fail-closed message when runId is already bound to another identity. */
export const HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE =
  'Host task.create process-local runId is already bound to another identity.';

/** Residual 457: fail-closed when runId conversation binding would change. */
export const HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE =
  'Host task.create process-local runId is already bound to another conversation.';

/** Residual 457: fail-closed when runId thread binding would change. */
export const HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE =
  'Host task.create process-local runId is already bound to another thread.';

/** Residual 495: process-local store rejects non-task.create (no silent ignore). */
export const HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE =
  'Host task.create process-local store only accepts agentType task.create.';

/** Residual 505: process-local store requires non-empty trimmed runId map key. */
export const HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE =
  'Host task.create process-local store requires a non-empty runId for process-local binding.';

/** Residual 511: process-local store requires non-empty trimmed threadId binding. */
export const HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE =
  'Host task.create process-local store requires a non-empty threadId for process-local binding.';

/** Residual 513: process-local store requires non-empty trimmed conversationId binding. */
export const HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE =
  'Host task.create process-local store requires a non-empty conversationId for process-local binding.';

/** Residual 515: process-local store requires non-empty trimmed identityId binding. */
export const HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE =
  'Host task.create process-local store requires a non-empty identityId for process-local binding.';

/**
 * Residual 503: compare process-local identity with start-builder trim semantics.
 * Empty/whitespace query never matches (fail-closed isolation).
 */
export function matchesHostTaskCreateIdentity(
  storedIdentityId: string,
  queryIdentityId: string,
): boolean {
  const stored = resolveTaskCreateIdentityId(storedIdentityId);
  const query = resolveTaskCreateIdentityId(queryIdentityId);
  return Boolean(stored && query && stored === query);
}

/**
 * Residual 509: compare process-local conversationId with start-builder trim semantics.
 * Empty/whitespace query never matches (fail-closed session isolation).
 */
export function matchesHostTaskCreateConversation(
  storedConversationId: string | null | undefined,
  queryConversationId: string | null | undefined,
): boolean {
  const stored = resolveTaskCreateConversationId(storedConversationId);
  const query = resolveTaskCreateConversationId(queryConversationId);
  return Boolean(stored && query && stored === query);
}

/**
 * Residual 511: compare process-local threadId with start-builder trim semantics.
 * Empty/whitespace query never matches (fail-closed session isolation).
 */
export function matchesHostTaskCreateThread(
  storedThreadId: string | null | undefined,
  queryThreadId: string | null | undefined,
): boolean {
  const stored = resolveTaskCreateThreadId(storedThreadId);
  const query = resolveTaskCreateThreadId(queryThreadId);
  return Boolean(stored && query && stored === query);
}

export type HostTaskCreateRunStore = {
  upsert(result: AgentRunResult): void;
  get(runId: string, identityId: string): AgentRunResult | null;
  list(identityId: string, params?: AgentRunListParams): AgentRun[];
  getEvents(runId: string, identityId: string): AgentEvent[] | null;
  /** Test helper — clear process store contents. */
  clear(): void;
  size(): number;
};

function pruneOldest(byRunId: Map<string, AgentRunResult>, maxEntries: number): void {
  if (byRunId.size <= maxEntries) return;
  const ordered = [...byRunId.entries()].sort(
    (left, right) => left[1].run.updatedAt - right[1].run.updatedAt,
  );
  const overflow = byRunId.size - maxEntries;
  for (let index = 0; index < overflow; index += 1) {
    const key = ordered[index]?.[0];
    if (key) byRunId.delete(key);
  }
}

export function createHostTaskCreateRunStore(
  options?: { maxEntries?: number },
): HostTaskCreateRunStore {
  const byRunId = new Map<string, AgentRunResult>();
  const maxEntries =
    typeof options?.maxEntries === 'number' && options.maxEntries > 0
      ? Math.floor(options.maxEntries)
      : HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES;

  return {
    upsert(result: AgentRunResult) {
      // Residual 495: fail-closed — do not silently ignore foreign agent types.
      if (result.run.agentType !== 'task.create') {
        throw new Error(HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE);
      }
      // Residual 505: process-local runId map key is trimmed non-empty (start 497 symmetry).
      const runId = resolveTaskCreateRunId(result.run.runId);
      if (!runId) {
        throw new Error(HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE);
      }
      // Residual 511: process-local threadId binding is trimmed non-empty (start 485 symmetry).
      const threadId = resolveTaskCreateThreadId(result.run.threadId);
      if (!threadId) {
        throw new Error(HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE);
      }
      // Residual 513: process-local conversationId is trimmed non-empty (start 483 symmetry).
      const conversationId = resolveTaskCreateConversationId(result.run.conversationId);
      if (!conversationId) {
        throw new Error(HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE);
      }
      // Residual 515: process-local identityId is trimmed non-empty (start 493 symmetry).
      const identityId = resolveTaskCreateIdentityId(result.run.identityId);
      if (!identityId) {
        throw new Error(HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE);
      }
      const needsNormalize =
        result.run.runId !== runId ||
        result.run.threadId !== threadId ||
        result.run.conversationId !== conversationId ||
        result.run.identityId !== identityId ||
        result.events.some((event) => event.runId !== runId) ||
        result.interrupts.some((interrupt) => interrupt.runId !== runId);
      const normalized = needsNormalize
        ? {
            ...result,
            run: { ...result.run, runId, threadId, conversationId, identityId },
            events: result.events.map((event) =>
              event.runId === runId ? event : { ...event, runId },
            ),
            interrupts: result.interrupts.map((interrupt) =>
              interrupt.runId === runId ? interrupt : { ...interrupt, runId },
            ),
          }
        : result;
      // Residual 451/503/515: process-local runId identity binding (no foreign takeover;
      // compare trimmed non-empty identities; stored identity is normalized).
      const existing = byRunId.get(runId);
      if (
        existing &&
        !matchesHostTaskCreateIdentity(existing.run.identityId, normalized.run.identityId)
      ) {
        throw new Error(HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE);
      }
      // Residual 457/509/511: conversation/thread binding (no session rebinding via runId reuse).
      if (existing) {
        // Residual 509: conversation binding compares trimmed session ids.
        const existingConversation =
          resolveTaskCreateConversationId(existing.run.conversationId) ?? null;
        const nextConversation =
          resolveTaskCreateConversationId(normalized.run.conversationId) ?? null;
        if (existingConversation !== nextConversation) {
          throw new Error(HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE);
        }
        // Residual 511: thread binding compares trimmed thread ids.
        if (!matchesHostTaskCreateThread(existing.run.threadId, normalized.run.threadId)) {
          throw new Error(HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE);
        }
      }
      byRunId.set(runId, normalized);
      pruneOldest(byRunId, maxEntries);
    },

    get(runId: string, identityId: string): AgentRunResult | null {
      // Residual 505: trim map key; blank runId never hits a store entry.
      const key = resolveTaskCreateRunId(runId);
      if (!key) return null;
      const result = byRunId.get(key);
      if (!result) return null;
      // Residual 503: trimmed identity isolation (blank query never matches).
      if (!matchesHostTaskCreateIdentity(result.run.identityId, identityId)) return null;
      return result;
    },

    list(identityId: string, params?: AgentRunListParams): AgentRun[] {
      let runs = [...byRunId.values()]
        .map((item) => item.run)
        .filter(
          (run) =>
            matchesHostTaskCreateIdentity(run.identityId, identityId) &&
            run.agentType === 'task.create',
        );

      if (params?.conversationId !== undefined && params?.conversationId !== null) {
        // Residual 509: trimmed conversation filter; blank query matches nothing.
        const queryConversationId = resolveTaskCreateConversationId(params.conversationId);
        if (!queryConversationId) {
          runs = [];
        } else {
          runs = runs.filter((run) =>
            matchesHostTaskCreateConversation(run.conversationId, queryConversationId),
          );
        }
      }
      if (params?.status?.length) {
        const allowed = new Set(params.status);
        runs = runs.filter((run) => allowed.has(run.status));
      }
      if (params?.activeOnly) {
        runs = runs.filter((run) => ACTIVE_STATUSES.has(run.status));
      }

      runs.sort((left, right) => right.updatedAt - left.updatedAt);

      if (typeof params?.limit === 'number' && params.limit > 0) {
        runs = runs.slice(0, params.limit);
      }
      return runs;
    },

    getEvents(runId: string, identityId: string): AgentEvent[] | null {
      const result = this.get(runId, identityId);
      return result ? result.events : null;
    },

    clear() {
      byRunId.clear();
    },

    size() {
      return byRunId.size;
    },
  };
}

/** Shared process registry used by createAgentRuntimeService (single runtime composition). */
let defaultStore: HostTaskCreateRunStore | null = null;

export function getDefaultHostTaskCreateRunStore(): HostTaskCreateRunStore {
  if (!defaultStore) {
    defaultStore = createHostTaskCreateRunStore();
  }
  return defaultStore;
}

/** Test-only: replace default store / reset. */
export function resetDefaultHostTaskCreateRunStoreForTests(): void {
  defaultStore = createHostTaskCreateRunStore();
}
