/**
 * Specs for the bounded HTTP request metrics recorder (RefArch Phase 6).
 * 有界 HTTP 请求 metrics recorder 的规格（RefArch 阶段 6）。
 *
 * Locks the Prometheus counter/histogram semantics: bounded label keys,
 * cumulative bucket counts, sum/count consistency, entity-ID aggregation into
 * one route series, and the bounded ring buffer for JSON quantiles.
 *
 * 锁定 Prometheus counter/histogram 语义：有界 label key、累计 bucket count、
 * sum/count 一致性、实体 ID 聚合到同一 route series，以及用于 JSON quantile
 * 的有界 ring buffer。
 */

import { describe, expect, it } from 'vitest';
import {
  escapePrometheusLabelValue,
  HTTP_REQUEST_DURATION_BUCKETS_MS,
  HttpRequestMetricsRecorder,
} from './http-request-metrics';
import type { HttpRequestObservation } from './http-request-observation';

function observation(overrides: Partial<HttpRequestObservation> = {}): HttpRequestObservation {
  return {
    requestId: 'req-1',
    traceId: 'req-1',
    method: 'GET',
    routeTemplate: '/api/goals/:id',
    statusCode: 200,
    outcome: 'finished',
    durationMs: 42,
    ...overrides,
  };
}

describe('HttpRequestMetricsRecorder', () => {
  it('aggregates different entity IDs into the same bounded route series', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ routeTemplate: '/api/goals/:id', durationMs: 10 }));
    recorder.complete(observation({ routeTemplate: '/api/goals/:id', durationMs: 30 }));
    recorder.complete(observation({ routeTemplate: '/api/tasks/:id', durationMs: 5 }));

    const series = recorder.getSeries();
    expect(series).toHaveLength(2);
    const goals = series.find((s) => s.route === '/api/goals/:id')!;
    expect(goals.count).toBe(2);
    expect(goals.sumMs).toBe(40);
    // No entity ID appears anywhere in the series labels.
    expect(JSON.stringify(series)).not.toContain('goal-');
  });

  it('never uses requestId or identityId as label keys', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ requestId: 'req-a', identityId: 'identity-1' }));
    recorder.complete(observation({ requestId: 'req-b', identityId: 'identity-2' }));

    const series = recorder.getSeries();
    expect(series).toHaveLength(1);
    expect(series[0]!.count).toBe(2);
    expect(JSON.stringify(series)).not.toContain('req-a');
    expect(JSON.stringify(series)).not.toContain('identity-1');
  });

  it('keeps bucket counts cumulative and ending at the total count', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ durationMs: 3 }));
    recorder.complete(observation({ durationMs: 60 }));
    recorder.complete(observation({ durationMs: 30_000 }));

    const series = recorder.getSeries()[0]!;
    expect(series.count).toBe(3);
    expect(series.buckets).toHaveLength(HTTP_REQUEST_DURATION_BUCKETS_MS.length);

    // Cumulative semantics: each bucket counts observations <= its `le`, so the
    // sequence is monotonic non-decreasing and never exceeds the total count.
    let previous = 0;
    for (const bucket of series.buckets) {
      expect(bucket).toBeGreaterThanOrEqual(previous);
      expect(bucket).toBeLessThanOrEqual(series.count);
      previous = bucket;
    }

    // 3ms falls into le=5; 60ms into le=100 but not le=50.
    const le5Index = HTTP_REQUEST_DURATION_BUCKETS_MS.indexOf(5);
    const le50Index = HTTP_REQUEST_DURATION_BUCKETS_MS.indexOf(50);
    const le100Index = HTTP_REQUEST_DURATION_BUCKETS_MS.indexOf(100);
    expect(series.buckets[le5Index]).toBe(1);
    expect(series.buckets[le50Index]).toBe(1);
    expect(series.buckets[le100Index]).toBe(2);
    // 30s exceeds every finite bucket; only the +Inf bucket reaches the count.
    expect(series.maxMs).toBe(30_000);
    expect(series.buckets[series.buckets.length - 1]).toBe(2);
  });

  it('keeps a bounded ring buffer per series for JSON quantiles', () => {
    const recorder = new HttpRequestMetricsRecorder();
    for (let i = 0; i < 1500; i += 1) {
      recorder.complete(observation({ durationMs: i }));
    }

    const series = recorder.getSeries()[0]!;
    expect(series.count).toBe(1500);
    // Only the newest 1000 samples are retained: kept durations are 500..1499,
    // so p50 is 1000. If the buffer were unbounded, p50 would be 750.
    expect(series.p50Ms).toBe(1000);
    expect(series.maxMs).toBe(1499);
  });

  it('computes weighted avg from sum/count', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ durationMs: 10 }));
    recorder.complete(observation({ durationMs: 90 }));

    const series = recorder.getSeries()[0]!;
    expect(series.sumMs).toBe(100);
    expect(series.avgMs).toBe(50);
  });

  it('escapes Prometheus label values', () => {
    expect(escapePrometheusLabelValue('plain')).toBe('plain');
    expect(escapePrometheusLabelValue('a"b')).toBe('a\\"b');
    expect(escapePrometheusLabelValue('a\\b')).toBe('a\\\\b');
    expect(escapePrometheusLabelValue('a\nb')).toBe('a\\nb');
  });
});
