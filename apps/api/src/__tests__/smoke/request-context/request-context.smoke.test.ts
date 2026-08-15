/**
 * Request Context API Smoke Test (RefArch Phase 2)
 *
 * Locks the producer-owned request metadata across the real global middleware
 * pipeline: client-supplied/generated request IDs, response header echo,
 * envelope `traceId`, auth/404 failures, and SSE header-before-flush.
 */
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { applyGlobalMiddleware } from '../../../shared/infrastructure/middleware/global';
import { applyErrorHandlers } from '../../../shared/infrastructure/middleware/error';
import { createAuthMiddleware } from '../../../shared/infrastructure/http/middlewares/auth-middleware';
import { MetricsStore } from '../../../shared/infrastructure/http/middlewares/performance.middleware';
import { expressAdapter } from '@memoflow/utils/result';
import { ok } from '@memoflow/contracts/result';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createApp(): Express {
  const app = express();
  applyGlobalMiddleware(app, new MetricsStore());

  // Auth: mock Cloud Auth — resolves a principal only with a valid bearer token.
  const auth = createAuthMiddleware({
    resolveNodePrincipal: async (headers: Record<string, unknown>) => {
      if (headers.authorization === 'Bearer valid-token') {
        return {
          identityId: 'identity-smoke-1',
          sessionId: 'session-smoke-1',
          email: 'smoke@example.com',
          emailVerified: true,
        };
      }
      return null;
    },
  } as never);

  app.get('/api/echo', auth, expressAdapter(() => Promise.resolve(ok({ message: 'echo' }))));

  app.get('/api/sse', auth, (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write('event: message\ndata: hello\n\n');
    res.end();
  });

  applyErrorHandlers(app);
  return app;
}

describe('Request Context smoke (RefArch Phase 2)', () => {
  it('echoes a client-supplied X-Request-Id on a JSON route and in the envelope traceId', async () => {
    const res = await request(createApp())
      .get('/api/echo')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'client-abc-123');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('client-abc-123');
    expect(res.body.ok).toBe(true);
    expect(res.body.traceId).toBe('client-abc-123');
  });

  it('generates a UUID when no X-Request-Id is sent and uses it everywhere', async () => {
    const res = await request(createApp())
      .get('/api/echo')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('falls back to a UUID (not 400) for an invalid X-Request-Id', async () => {
    const res = await request(createApp())
      .get('/api/echo')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'bad header value with spaces');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('auth failure (401) echoes the same X-Request-Id and traceId', async () => {
    const res = await request(createApp()).get('/api/echo').set('X-Request-Id', 'client-auth-fail');

    expect(res.status).toBe(401);
    expect(res.headers['x-request-id']).toBe('client-auth-fail');
    expect(res.body.ok).toBe(false);
    expect(res.body.traceId).toBe('client-auth-fail');
  });

  it('404 echoes the X-Request-Id with the generated traceId', async () => {
    const res = await request(createApp()).get('/api/not-a-route');

    expect(res.status).toBe(404);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('SSE response carries X-Request-Id before the first chunk with framing preserved', async () => {
    const res = await request(createApp())
      .get('/api/sse')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'client-sse-1');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('client-sse-1');
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.headers['cache-control']).toBe('no-cache, no-transform');
    expect(res.headers['connection']).toBe('keep-alive');
    expect(res.headers['x-accel-buffering']).toBe('no');
    expect(res.text).toContain('event: message');
    expect(res.text).toContain('data: hello');
  });
});
