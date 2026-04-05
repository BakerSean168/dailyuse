import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ResultErrorException } from '@dailyuse/contracts/result';
import { applyErrorHandlers } from './error';

function createAppWithError(error: Error) {
  const app = express();

  app.get('/boom', (_req, _res, next) => {
    next(error);
  });

  applyErrorHandlers(app);

  return app;
}

describe('applyErrorHandlers', () => {
  it('maps CORS rejections to 403 FORBIDDEN', async () => {
    const app = createAppWithError(new Error('Not allowed by CORS'));

    const res = await request(app).get('/boom');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: 'Not allowed by CORS',
    });
  });

  it('keeps unexpected errors as 500 INTERNAL_ERROR', async () => {
    const app = createAppWithError(new Error('boom'));

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('preserves structured result errors instead of collapsing them to 500', async () => {
    const app = createAppWithError(
      new ResultErrorException(
        'Access denied',
        'FORBIDDEN',
        [{ code: 'MISSING_ROLE', message: 'admin required' }],
        { source: 'middleware-spec' },
        403,
      ),
    );

    const res = await request(app).get('/boom');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: 'Access denied',
      details: [{ code: 'MISSING_ROLE', message: 'admin required' }],
      context: { source: 'middleware-spec' },
    });
  });
});
