import {
  type OperationMetricModule,
  type OutboxState,
  type WorkerOutcome,
  outboxMetricKey,
  workerMetricKey,
} from './unified-metrics';

/**
 * W7 统一指标 recorder (B)。
 *
 * 宿主（metrics service / runtime / worker）把模块事件映射为
 *   memoflow.<module>.outbox.<state>
 *   memoflow.<module>.worker.<outcome>
 * 并提供快照供 dashboard / 导出端消费。禁止只记终态——persisted/claimed/
 * retried/failed 全部要有落点。
 */
export interface UnifiedOperationMetricsRecorder {
  recordOutbox(module: OperationMetricModule, state: OutboxState, by?: number): void;
  recordWorker(module: OperationMetricModule, outcome: WorkerOutcome, by?: number): void;
  snapshot(): Readonly<Record<string, number>>;
}

export function createUnifiedOperationMetricsRecorder(): UnifiedOperationMetricsRecorder {
  const counters = new Map<string, number>();

  return {
    recordOutbox(module, state, by = 1) {
      const key = outboxMetricKey(module, state);
      counters.set(key, (counters.get(key) ?? 0) + by);
    },
    recordWorker(module, outcome, by = 1) {
      const key = workerMetricKey(module, outcome);
      counters.set(key, (counters.get(key) ?? 0) + by);
    },
    snapshot() {
      const result: Record<string, number> = {};
      for (const [key, value] of counters) {
        result[key] = value;
      }
      return result;
    },
  };
}

/**
 * P1-5：进程级共享 recorder。五个模块的真实 persistence/claim/retry/failure/
 * dead-letter/worker 路径都发射到这个共享快照，metrics controller / dashboard
 * 通过 `getUnifiedOperationMetricsSnapshot()` 消费同一份数据。
 */
export const globalUnifiedOperationMetrics: UnifiedOperationMetricsRecorder =
  createUnifiedOperationMetricsRecorder();

/** P1-5：dashboard / exporter 读取统一快照的唯一入口。 */
export function getUnifiedOperationMetricsSnapshot(): Readonly<Record<string, number>> {
  return globalUnifiedOperationMetrics.snapshot();
}
