import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { logsController } from './logs.controller';

vi.mock('@dailyuse/utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('logsController.capture (residual 621)', () => {
  it('returns HttpResponse ok envelope for valid batch', () => {
    const res = mockRes();
    logsController.capture(
      { body: { logs: [{ level: 'info', message: 'hello' }] } } as Request,
      res,
    );
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      ok: boolean;
      data?: { processed: number; truncated: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ processed: 1, truncated: false });
    expect(body).not.toHaveProperty('success');
  });

  it('returns HttpResponse failure envelope for invalid body', () => {
    const res = mockRes();
    logsController.capture({ body: { logs: 'nope' } } as Request, res);
    expect(res.statusCode).toBe(400);
    const body = res.body as { ok: boolean; error?: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe('BAD_REQUEST');
    expect(body).not.toHaveProperty('success');
  });

  it('truncates oversize batches and reports truncated=true', () => {
    const res = mockRes();
    const logs = Array.from({ length: 105 }, (_, i) => ({
      level: 'info' as const,
      message: `m-${i}`,
    }));
    logsController.capture({ body: { logs } } as Request, res);
    const body = res.body as {
      ok: boolean;
      data?: { processed: number; truncated: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ processed: 100, truncated: true });
  });
});
