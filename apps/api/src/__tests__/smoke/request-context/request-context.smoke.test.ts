/**
 * Request Context API Smoke Test (RefArch Phase 2)
 *
 * Locks the producer-owned request metadata across the real global middleware
 * pipeline: client-supplied/generated request IDs, response header echo,
 * envelope `traceId`, auth/404 failures, and the real AI AssistantFacade SSE
 * route (header-before-flush, done/error framing, disconnect cancellation and
 * entry → Python correlation).
 *
 * The Python-side assertion is the boundary contract: the entry `requestId`
 * captured by the AI dispatch service is the exact value the internal client
 * forwards as `X-Request-Id`, which the Python `RequestContextMiddleware`
 * stores in `request.state.request_id` and echoes in the `X-Request-Id`
 * response header (see apps/ai-service/.../middleware/request_context.py).
 */
import express, { type Express } from 'express';
import request from 'supertest';
import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyGlobalMiddleware } from '../../../shared/infrastructure/middleware/global';
import { applyErrorHandlers } from '../../../shared/infrastructure/middleware/error';
import { createAuthMiddleware } from '../../../shared/infrastructure/http/middlewares/auth-middleware';
import { MetricsStore } from '../../../shared/infrastructure/http/middlewares/performance.middleware';
import { expressAdapter } from '@memoflow/utils/result';
import { ok, error } from '@memoflow/contracts/result';
import {
  registerAIAssistantRoutes,
  AIAssistantFacadeController,
  AIServiceChatExecutionAdapter,
  createRealAssistantDispatchService,
  type AIAssistantFacadeControllerService,
} from '@memoflow/ai/testing';
import type { AssistantCommand } from '@memoflow/contracts/ai';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AI_DISPATCH_PATH = '/api/v1/ai/assistant/dispatch/sse';

interface CapturedDispatch {
  requestId?: string;
  signal?: AbortSignal;
}

function createAssistantService(captured: CapturedDispatch): AIAssistantFacadeControllerService {
  return {
    dispatchAssistant: vi.fn(
      async (
        _command: AssistantCommand,
        onEvent: (event: unknown) => void,
        signal?: AbortSignal,
        requestId?: string,
      ) => {
        captured.requestId = requestId;
        captured.signal = signal;
        onEvent({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        onEvent({ type: 'message.delta', runId: 'run-1', content: 'hello' });
        return ok({ eventCount: 2 });
      },
    ),
  };
}

function createApp(options: { dispatchService?: AIAssistantFacadeControllerService } = {}): {
  app: Express;
  captured: CapturedDispatch;
  dispatchService: AIAssistantFacadeControllerService;
} {
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

  app.get(
    '/api/echo',
    auth,
    expressAdapter(() => Promise.resolve(ok({ message: 'echo' }))),
  );

  const captured: CapturedDispatch = {};
  const dispatchService = options.dispatchService ?? createAssistantService(captured);
  const assistantController = new AIAssistantFacadeController(dispatchService);
  app.use(
    '/api/v1/ai/assistant',
    registerAIAssistantRoutes(assistantController, {
      auth,
      requireRole: () => auth,
    }),
  );

  applyErrorHandlers(app);
  return { app, captured, dispatchService };
}

const ASSISTANT_BODY = {
  type: 'message',
  conversationId: 'conv-1',
  content: 'hi',
  surface: 'web',
};

describe('Request Context smoke (RefArch Phase 2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('echoes a client-supplied X-Request-Id on a JSON route and in the envelope traceId', async () => {
    const { app } = createApp();
    const res = await request(app)
      .get('/api/echo')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'client-abc-123');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('client-abc-123');
    expect(res.body.ok).toBe(true);
    expect(res.body.traceId).toBe('client-abc-123');
  });

  it('generates a UUID when no X-Request-Id is sent and uses it everywhere', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/echo').set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('falls back to a UUID (not 400) for an invalid X-Request-Id', async () => {
    const { app } = createApp();
    const res = await request(app)
      .get('/api/echo')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'bad header value with spaces');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('auth failure (401) echoes the same X-Request-Id and traceId', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/echo').set('X-Request-Id', 'client-auth-fail');

    expect(res.status).toBe(401);
    expect(res.headers['x-request-id']).toBe('client-auth-fail');
    expect(res.body.ok).toBe(false);
    expect(res.body.traceId).toBe('client-auth-fail');
  });

  it('404 echoes the X-Request-Id with the generated traceId', async () => {
    const { app } = createApp();
    const res = await request(app).get('/api/not-a-route');

    expect(res.status).toBe(404);
    expect(res.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(res.body.traceId).toBe(res.headers['x-request-id']);
  });

  it('real AI SSE route: header-before-first-chunk, done framing, and entry requestId reaches the Python AI service (request.state / completion log / echo header)', async () => {
    // Fake only the Python boundary: capture the `X-Request-Id` the real
    // AIServiceInternalClient forwards (== Python request.state.request_id),
    // record a completion log entry, and echo the same ID back in the response
    // header exactly like `RequestContextMiddleware` does.
    interface PythonSideState {
      requestStateRequestId?: string;
      completionLog: Array<{ requestId: string; path: string; statusCode: number }>;
      responseHeaderRequestId?: string;
    }
    const pySide: PythonSideState = { completionLog: [] };
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const requestId = headers['X-Request-Id'];
      const url = new URL(String(input));
      pySide.requestStateRequestId = requestId;
      pySide.completionLog.push({ requestId, path: url.pathname, statusCode: 200 });
      pySide.responseHeaderRequestId = requestId;
      const echoHeaders = { 'X-Request-Id': requestId };
      if (url.pathname.endsWith('/internal/chat/stream')) {
        const sseBody = [
          'event: message',
          `data: ${JSON.stringify({ content: 'hello from python', finish_reason: 'stop' })}`,
          '',
          'event: done',
          'data: {}',
          '',
          '',
        ].join('\n');
        return new Response(sseBody, {
          status: 200,
          headers: { ...echoHeaders, 'Content-Type': 'text/event-stream' },
        });
      }
      return new Response(JSON.stringify({ content: 'hello from python', finish_reason: 'stop' }), {
        status: 200,
        headers: { ...echoHeaders, 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Real dispatch chain: route → controller → AssistantFacade → DirectTurnEngine
    // → AIServiceChatExecutionAdapter → real AIServiceInternalClient (fetch above).
    const chatPort = new AIServiceChatExecutionAdapter({
      baseUrl: 'http://127.0.0.1:8100',
      serviceSecret: 'shared-secret',
      serviceName: 'memoflow-api',
    });
    const { service, conversationId } = createRealAssistantDispatchService({
      identityId: 'identity-smoke-1',
      chatPort,
    });
    const { app } = createApp({ dispatchService: service });
    const body = { ...ASSISTANT_BODY, conversationId };

    const res = await request(app)
      .post(AI_DISPATCH_PATH)
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'client-sse-ai-1')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('client-sse-ai-1');
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.headers['cache-control']).toBe('no-cache, no-transform');
    expect(res.headers['connection']).toBe('keep-alive');
    expect(res.headers['x-accel-buffering']).toBe('no');
    expect(res.text).toContain('event: assistant');
    expect(res.text).toContain('"type":"run.started"');
    expect(res.text).toContain('"type":"message.delta"');
    expect(res.text).toContain('event: done');
    // The exact entry requestId reached the real internal client and was
    // forwarded verbatim as `X-Request-Id` — Python's request.state.request_id.
    expect(pySide.requestStateRequestId).toBe('client-sse-ai-1');
    // The Python completion log carries the same ID on the stream path.
    expect(pySide.completionLog).toContainEqual(
      expect.objectContaining({
        requestId: 'client-sse-ai-1',
        path: '/internal/chat/stream',
        statusCode: 200,
      }),
    );
    // Python echoes the same X-Request-Id back on the response header.
    expect(pySide.responseHeaderRequestId).toBe('client-sse-ai-1');
    vi.unstubAllGlobals();
  });

  it('real AI SSE route: structured error event carries the result error', async () => {
    const dispatchService = {
      dispatchAssistant: vi.fn(async () => error('RATE_LIMITED', '请求过于频繁')),
    } as ReturnType<typeof createAssistantService>;
    const { app } = createApp({ dispatchService });
    const res = await request(app)
      .post(AI_DISPATCH_PATH)
      .set('Authorization', 'Bearer valid-token')
      .set('X-Request-Id', 'client-sse-ai-error')
      .set('Content-Type', 'application/json')
      .send(ASSISTANT_BODY);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('client-sse-ai-error');
    expect(res.text).toContain('event: error');
    expect(res.text).toContain('"code":"RATE_LIMITED"');
    expect(res.text).toContain('"message":"请求过于频繁"');
  });

  it('real AI SSE route: disconnect cancels the in-flight dispatch (abort signal)', async () => {
    const captured: CapturedDispatch = {};
    const dispatchService = {
      dispatchAssistant: vi.fn(
        async (
          _command: AssistantCommand,
          _onEvent: (event: unknown) => void,
          signal?: AbortSignal,
          requestId?: string,
        ) => {
          captured.requestId = requestId;
          captured.signal = signal;
          // Hold the dispatch in flight until the SSE connection closes.
          await new Promise<void>((resolve) => {
            if (!signal || signal.aborted) {
              resolve();
              return;
            }
            signal.addEventListener('abort', () => resolve(), { once: true });
          });
          return ok({ eventCount: 0 });
        },
      ),
    } as ReturnType<typeof createAssistantService>;
    const { app } = createApp({ dispatchService });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as { port: number }).port;

    try {
      const socket = http.request(
        {
          host: '127.0.0.1',
          port,
          path: AI_DISPATCH_PATH,
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'x-request-id': 'client-sse-ai-abort',
            'content-type': 'application/json',
          },
        },
        () => undefined,
      );
      socket.write(JSON.stringify(ASSISTANT_BODY));
      socket.end();

      // Wait until the AI service observed the dispatch (signal + requestId).
      await vi.waitFor(() => expect(captured.signal).toBeDefined());
      expect(captured.requestId).toBe('client-sse-ai-abort');
      expect(captured.signal?.aborted).toBe(false);

      socket.destroy();
      await vi.waitFor(() => expect(captured.signal?.aborted).toBe(true));
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
