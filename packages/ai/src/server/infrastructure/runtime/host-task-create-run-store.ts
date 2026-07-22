/**
 * Residual 435: process-local Host task.create run store foundation.
 *
 * TS task.create start (residual 431) does not hit Python LangGraph checkpointers.
 * This registry keeps started results for getRun/listRuns/getEvents within the
 * same AI runtime process so conversation restore can rehydrate beyond client
 * localStorage alone. Not a cross-process durable database.
 */

import type { AgentEvent, AgentRun, AgentRunListParams, AgentRunResult } from '@dailyuse/contracts/ai';

const ACTIVE_STATUSES = new Set([
  'pending',
  'running',
  'waiting_clarification',
  'waiting_approval',
  'waiting_execution',
]);

export type HostTaskCreateRunStore = {
  upsert(result: AgentRunResult): void;
  get(runId: string, identityId: string): AgentRunResult | null;
  list(identityId: string, params?: AgentRunListParams): AgentRun[];
  getEvents(runId: string, identityId: string): AgentEvent[] | null;
  /** Test helper — clear process store contents. */
  clear(): void;
  size(): number;
};

export function createHostTaskCreateRunStore(): HostTaskCreateRunStore {
  const byRunId = new Map<string, AgentRunResult>();

  return {
    upsert(result: AgentRunResult) {
      if (result.run.agentType !== 'task.create') {
        return;
      }
      byRunId.set(result.run.runId, result);
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
