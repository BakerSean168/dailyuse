// ==========================================
// Business Metrics (R0-3)
// 关键业务指标的内存 recorder：occurrence 状态、outbox age、投影滞后、
// 重复键/乐观锁冲突、AI 部分失败。宿主可扩展为指标导出（当前先记日志）。
// ==========================================

export type BusinessMetricKey =
  | 'schedule.occurrence.claimed'
  | 'schedule.occurrence.completed'
  | 'schedule.occurrence.failed'
  | 'outbox.fallback.enqueued'
  | 'outbox.fallback.failed'
  | 'duplicate.key.conflict'
  | 'optimistic.conflict'
  | 'projection.lagCount'
  | 'ai.partialFailure';

/** 计数器（单调递增） */
export type CounterMetricKey =
  | 'schedule.occurrence.claimed'
  | 'schedule.occurrence.completed'
  | 'schedule.occurrence.failed'
  | 'outbox.fallback.enqueued'
  | 'outbox.fallback.failed'
  | 'duplicate.key.conflict'
  | 'optimistic.conflict'
  | 'ai.partialFailure';

/** 即时值（gauge） */
export type GaugeMetricKey = 'projection.lagCount';

export interface BusinessMetricRecorder {
  /** 计数器 +1（默认 1）。 */
  increment(key: CounterMetricKey, by?: number): void;
  /** 记录 gauge 即时值。 */
  recordGauge(key: GaugeMetricKey, value: number): void;
  /** 当前快照（宿主导出/日志用）。 */
  snapshot(): Readonly<Partial<Record<BusinessMetricKey, number>>>;
}

export function createBusinessMetricRecorder(
  now: () => Date = () => new Date(),
): BusinessMetricRecorder {
  const counters = new Map<CounterMetricKey, number>();
  const gauges = new Map<GaugeMetricKey, number>();

  return {
    increment(key, by = 1) {
      counters.set(key, (counters.get(key) ?? 0) + by);
    },

    recordGauge(key, value) {
      gauges.set(key, value);
    },

    snapshot() {
      const result: Partial<Record<BusinessMetricKey, number>> = {};
      for (const [key, value] of counters) {
        result[key] = value;
      }
      for (const [key, value] of gauges) {
        result[key] = value;
      }
      void now;
      return result;
    },
  };
}
