import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    BUILD_TIMESTAMP: '2026-07-22T00:00:00Z',
    GIT_COMMIT: 'abc1234',
  },
  isDevelopment: false,
  isProduction: false,
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

describe('infoController.getInfo (residual 625)', () => {
  beforeEach(() => {
    // Residual 1331: full-suite workers may cache env before this file's mock;
    // re-import the controller against the mocked env module each run.
    vi.resetModules();
  });

  it('returns HttpResponse ok envelope with app info payload', async () => {
    const { infoController } = await import('./info.controller');
    const res = mockRes();
    infoController.getInfo({} as Request, res);
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      ok: boolean;
      data?: {
        name: string;
        version: string;
        environment: string;
        build?: { commit?: string; timestamp?: string };
        uptime?: { seconds: number; formatted: string };
      };
    };
    expect(body.ok).toBe(true);
    expect(body.data?.environment).toBe('test');
    expect(body.data?.build?.commit).toBe('abc1234');
    expect(body.data?.build?.timestamp).toBe('2026-07-22T00:00:00Z');
    expect(typeof body.data?.uptime?.seconds).toBe('number');
    expect(typeof body.data?.name).toBe('string');
    expect(body).not.toHaveProperty('success');
    // payload fields must not leak to envelope top-level
    expect(body).not.toHaveProperty('environment');
    expect(body).not.toHaveProperty('uptime');
  });
});
