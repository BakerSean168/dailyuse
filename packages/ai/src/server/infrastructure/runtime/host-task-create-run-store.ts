/**
 * Residual 435/447/451: process-local Host task.create run store foundation.
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
 */

import type { AgentEvent, AgentRun, AgentRunListParams, AgentRunResult } from '@dailyuse/contracts/ai';

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
      if (result.run.agentType !== 'task.create') {
        return;
      }
      // Residual 451: process-local runId identity binding (no foreign takeover).
      const existing = byRunId.get(result.run.runId);
      if (existing && existing.run.identityId !== result.run.identityId) {
        throw new Error(HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE);
      }
      byRunId.set(result.run.runId, result);
      pruneOldest(byRunId, maxEntries);
    },

    get(runId: string, identityId: string): AgentRunResult | null {
      const result = byRunId.get(runId);
      if (!result) return null;
      if (result.run.identityId !== identityId) return null;
      return result;
    },

    list(identityId: string, params?: AgentRunListParams): AgentRun[] {
      let runs = [...byRunId.values()]
        .map((item) => item.run)
        .filter((run) => run.identityId === identityId && run.agentType === 'task.create');

      if (params?.conversationId) {
        runs = runs.filter((run) => run.conversationId === params.conversationId);
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
