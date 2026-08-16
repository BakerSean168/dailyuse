/**
 * Bounded HTTP request metrics (RefArch Phase 6).
 * 有界 HTTP 请求指标（RefArch 阶段 6）。
 *
 * Implements the Prometheus contract from the plan: `http_requests_total` is a
 * counter keyed by method/route/status/outcome and `http_request_duration_ms`
 * is a real histogram with fixed buckets. In-memory state is aggregated per
 * bounded label key — never one object per request — and each key keeps only a
 * bounded ring buffer of raw samples for the JSON quantile summary.
 *
 * 实现计划中的 Prometheus 契约：`http_requests_total` 是以
 * method/route/status/outcome 为键的 counter；`http_request_duration_ms` 是
 * 固定 bucket 的真实 histogram。内存状态按有界 label key 聚合——绝不为每个
 * request 保存永久对象——每个 key 只为 JSON quantile summary 保留有上限的
 * ring buffer。
 */

import type { HttpRequestObservation, HttpRequestObserver } from './http-request-observation';

/**
 * Fixed histogram bucket upper bounds in milliseconds (cumulative `le`).
 * histogram bucket 上界（毫秒，累计 `le`）。
 */
export const HTTP_REQUEST_DURATION_BUCKETS_MS = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
] as const;

/**
 * Maximum raw samples kept per label key for the JSON quantile summary.
 * 每个 label key 为 JSON quantile summary 保留的最大原始样本数。
 */
const MAX_SAMPLES_PER_SERIES = 1000;

/**
 * Bounded quantile stats for one label key.
 * 单个 label key 的有界 quantile 统计。
 */
export interface HttpRequestSeriesStats {
  readonly method: string;
  readonly route: string;
  readonly statusCode: number;
  readonly outcome: string;
  readonly count: number;
  readonly sumMs: number;
  readonly avgMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  /** Cumulative counts per bucket: each value counts observations with
   *  duration <= the bucket upper bound in `HTTP_REQUEST_DURATION_BUCKETS_MS`.
   *  每个 bucket 的累计计数：每个值统计 duration 不超过
   *  `HTTP_REQUEST_DURATION_BUCKETS_MS` 对应上界的 observation 数。 */
  readonly buckets: readonly number[];
}

interface HttpRequestSeriesState {
  count: number;
  sumMs: number;
  buckets: number[];
  samples: number[];
}

function seriesKey(observation: HttpRequestObservation): string {
  return [
    observation.method,
    observation.routeTemplate,
    String(observation.statusCode),
    observation.outcome,
  ].join('|');
}

function percentile(sorted: number[], percentileValue: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  return sorted[Math.min(sorted.length - 1, Math.floor((percentileValue / 100) * sorted.length))]!;
}

/**
 * In-memory metrics recorder aggregating terminal observations into bounded
 * Prometheus counter/histogram series.
 *
 * 将 terminal observation 聚合为有界 Prometheus counter/histogram series 的
 * 内存 metrics recorder。
 */
export class HttpRequestMetricsRecorder implements HttpRequestObserver {
  private readonly series = new Map<string, HttpRequestSeriesState>();

  /**
   * Records one terminal observation. Identity and request IDs never enter the
   * label key — only method/route/status/outcome — so cardinality stays bounded.
   *
   * 记录一条 terminal observation。identity 与 request ID 绝不进入 label key
   * ——只有 method/route/status/outcome——因此基数保持有界。
   *
   * @param observation - Canonical terminal facts about the attempt.
   */
  complete(observation: HttpRequestObservation): void {
    const key = seriesKey(observation);
    let state = this.series.get(key);
    if (!state) {
      state = {
        count: 0,
        sumMs: 0,
        buckets: HTTP_REQUEST_DURATION_BUCKETS_MS.map(() => 0),
        samples: [],
      };
      this.series.set(key, state);
    }

    state.count += 1;
    state.sumMs += observation.durationMs;
    for (let i = 0; i < HTTP_REQUEST_DURATION_BUCKETS_MS.length; i += 1) {
      if (observation.durationMs <= HTTP_REQUEST_DURATION_BUCKETS_MS[i]!) {
        state.buckets[i]! += 1;
      }
    }
    state.samples.push(observation.durationMs);
    if (state.samples.length > MAX_SAMPLES_PER_SERIES) {
      state.samples.shift();
    }
  }

  /**
   * Returns all bounded series with quantile and bucket stats.
   * 返回所有含 quantile 与 bucket 统计的有界 series。
   *
   * @returns Stats for every observed label key.
   */
  getSeries(): HttpRequestSeriesStats[] {
    const result: HttpRequestSeriesStats[] = [];
    for (const [key, state] of this.series) {
      const [method, route, statusCode, outcome] = key.split('|') as [
        string,
        string,
        string,
        string,
      ];
      const sorted = [...state.samples].sort((a, b) => a - b);
      result.push({
        method,
        route,
        statusCode: Number(statusCode),
        outcome,
        count: state.count,
        sumMs: state.sumMs,
        avgMs: state.count > 0 ? Math.round(state.sumMs / state.count) : 0,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
        p99Ms: percentile(sorted, 99),
        maxMs: sorted.length > 0 ? sorted[sorted.length - 1]! : 0,
        buckets: [...state.buckets],
      });
    }
    return result;
  }

  /**
   * Clears all recorded series (per-instance lifecycle; never a global leak).
   * 清除所有已记录 series（按实例管理生命周期，绝不全局泄漏）。
   */
  clear(): void {
    this.series.clear();
  }
}

/**
 * Escapes a Prometheus label value per the text exposition format.
 * 按文本 exposition 格式转义 Prometheus label value。
 *
 * @param value - Raw label value.
 * @returns Value safe to embed inside double quotes.
 */
export function escapePrometheusLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
