import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ResultErrorException } from '@memoflow/contracts/result';
import { applyErrorHandlers } from './error';

function createAppWithError(error: Error) {
  const app = express();

  app.get('/boom', (_req, _res, next) => {
    next(error);
  });

  applyErrorHandlers(app);

  return app;
}

function createAppWith404() {
  const app = express();
  applyErrorHandlers(app);
  return app;
}

describe('applyErrorHandlers (residual 627)', () => {
  it('maps unknown routes to 404 HttpResponse NOT_FOUND envelope', async () => {
    const app = createAppWith404();

    const res = await request(app).get('/missing');

    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        code: 404,
        message: 'Not Found',
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Not Found',
        }),
        timestamp: expect.any(Number),
      }),
    );
    expect(res.body).not.toHaveProperty('success');
  });

  it('maps CORS rejections to 403 HttpResponse FORBIDDEN envelope', async () => {
    const app = createAppWithError(new Error('Not allowed by CORS'));

    const res = await request(app).get('/boom');

    expect(res.status).toBe(403);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        code: 403,
        message: 'Not allowed by CORS',
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Not allowed by CORS',
        }),
        timestamp: expect.any(Number),
      }),
    );
  });

  it('keeps unexpected errors as 500 HttpResponse INTERNAL_ERROR envelope', async () => {
    const app = createAppWithError(new Error('boom'));

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        code: 500,
        message: 'Internal server error',
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
        timestamp: expect.any(Number),
      }),
    );
  });

  it('preserves structured result errors as HttpResponse envelope', async () => {
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
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        code: 403,
        message: 'Access denied',
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: [{ code: 'MISSING_ROLE', message: 'admin required' }],
          context: { source: 'middleware-spec' },
        }),
        timestamp: expect.any(Number),
      }),
    );
  });
});
