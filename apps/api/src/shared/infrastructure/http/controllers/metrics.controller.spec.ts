import { describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { createMetricsController } from './metrics.controller';

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

describe('createMetricsController (residual 623)', () => {
  it('getJson returns HttpResponse ok envelope', () => {
    const store = {
      getAllStats: () => ({
        'GET /healthz': {
          count: 2,
          avg: 5,
          p50: 4,
          p95: 8,
          p99: 9,
          max: 10,
        },
      }),
    };
    const controller = createMetricsController(store as never);
    const res = mockRes();
    controller.getJson({} as Request, res);
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      ok: boolean;
      data?: { summary: { totalRequests: number; endpointCount: number } };
    };
    expect(body.ok).toBe(true);
    expect(body.data?.summary.totalRequests).toBe(2);
    expect(body.data?.summary.endpointCount).toBe(1);
    expect(body).not.toHaveProperty('success');
    expect(body).not.toHaveProperty('summary');
  });

  it('getPrometheus stays text/plain scraper contract', () => {
    const store = {
      getAllStats: () => ({}),
    };
    const controller = createMetricsController(store as never);
    const res = mockRes();
    controller.getPrometheus({} as Request, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/plain');
    expect(String(res.body)).toContain('process_uptime_seconds');
  });
});
