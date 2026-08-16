import { describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { createMetricsController } from './metrics.controller';
import { HttpRequestMetricsRecorder } from '../../observability/http-request-metrics';
import type { HttpRequestObservation } from '../../observability/http-request-observation';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    set(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
  };
}

function observation(overrides: Partial<HttpRequestObservation> = {}): HttpRequestObservation {
  return {
    requestId: 'req-1',
    traceId: 'req-1',
    method: 'GET',
    routeTemplate: '/api/goals/:id',
    statusCode: 200,
    outcome: 'finished',
    durationMs: 20,
    ...overrides,
  };
}

describe('createMetricsController (residual 623 + Phase 6 exposition)', () => {
  it('getJson returns HttpResponse ok envelope with count-weighted summary', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ durationMs: 10 }));
    recorder.complete(observation({ durationMs: 90 }));

    const controller = createMetricsController(recorder);
    const res = mockRes();
    controller.getJson({} as Request, res);
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      ok: boolean;
      data?: { summary: { totalRequests: number; overallAvgMs: number; endpointCount: number } };
    };
    expect(body.ok).toBe(true);
    expect(body.data?.summary.totalRequests).toBe(2);
    expect(body.data?.summary.overallAvgMs).toBe(50);
    expect(body.data?.summary.endpointCount).toBe(1);
    expect(body).not.toHaveProperty('success');
    expect(body).not.toHaveProperty('summary');
  });

  it('getPrometheus stays text/plain scraper contract with process + operation metrics', () => {
    const recorder = new HttpRequestMetricsRecorder();
    const controller = createMetricsController(recorder);
    const res = mockRes();
    controller.getPrometheus({} as Request, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/plain');
    expect(String(res.body)).toContain('process_uptime_seconds');
    expect(String(res.body)).toContain('memoflow_operation_metrics');
  });

  it('emits cumulative histogram buckets, sum and count matching the recorded series', () => {
    const recorder = new HttpRequestMetricsRecorder();
    recorder.complete(observation({ durationMs: 4 }));
    recorder.complete(observation({ durationMs: 4 }));
    recorder.complete(observation({ durationMs: 60 }));

    const controller = createMetricsController(recorder);
    const res = mockRes();
    controller.getPrometheus({} as Request, res);
    const output = String(res.body);

    const base = 'method="GET",route="/api/goals/:id",status="200",outcome="finished"';
    expect(output).toContain(`http_requests_total{${base}} 3`);
    expect(output).toContain(`http_request_duration_ms_sum{${base}} 68`);
    expect(output).toContain(`http_request_duration_ms_count{${base}} 3`);
    // le=5 bucket holds the two 4ms samples; +Inf equals _count.
    expect(output).toContain(`http_request_duration_ms_bucket{${base},le="5"} 2`);
    expect(output).toContain(`http_request_duration_ms_bucket{${base},le="+Inf"} 3`);
    // No pseudo-histogram quantile lines remain in Prometheus output.
    expect(output).not.toMatch(/http_request_duration_ms_(avg|p50|p95|p99)/);
    // No raw path/entity label ever appears.
    expect(output).not.toContain('/api/goals/goal-');
  });
});
