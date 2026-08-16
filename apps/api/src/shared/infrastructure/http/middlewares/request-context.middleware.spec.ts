/**
 * Request Context Middleware Spec
 * 请求上下文中间件测试
 *
 * Covers the RefArch Phase 2 producer contract: accept/fallback of the
 * client-supplied `X-Request-Id`, carrier shape, header-before-`next()`, and
 * the single terminal finish/abort structured log (injected clock, sensitive
 * field exclusion, no post-`headersSent` mutation).
 */
import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { ILogger } from '@memoflow/utils/logger';
import {
  acceptClientRequestId,
  createRequestContextMiddleware,
  type RequestContextCarrierRequest,
} from './request-context.middleware';
import type { HttpRequestSpan, HttpRequestTrace } from '../../observability/http-request-trace';
import type { HttpRequestObservation } from '../../observability/http-request-observation';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class MockResponse extends EventEmitter {
  headers: Record<string, string> = {};
  statusCode = 200;
  headersSent = false;
  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }
  getHeader(name: string): string | undefined {
    return this.headers[name];
  }
}

function createMockReq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    method: 'GET',
    path: '/test',
    headers: {},
    route: undefined,
    ...overrides,
  };
}

function createMockLogger(): ILogger {
  return {
    context: 'test',
    debug: vi.fn(),
    info: vi.fn(),
    http: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    setLevel: vi.fn(),
  } as unknown as ILogger;
}

interface InvokeResult {
  nextCalled: boolean;
  request: RequestContextCarrierRequest;
  response: MockResponse;
}

function invoke(
  middleware: ReturnType<typeof createRequestContextMiddleware>,
  req: Record<string, unknown>,
  res: MockResponse,
): InvokeResult {
  const request = req as unknown as RequestContextCarrierRequest;
  let nextCalled = false;
  middleware(
    request as Request,
    res as unknown as Response,
    (() => {
      nextCalled = true;
    }) as NextFunction,
  );
  return { nextCalled, request, response: res };
}

describe('acceptClientRequestId', () => {
  it('accepts a trimmed single value matching the allowlist', () => {
    expect(acceptClientRequestId('abc123')).toBe('abc123');
    expect(acceptClientRequestId('client-1.2:3_4')).toBe('client-1.2:3_4');
  });

  it('rejects missing, empty, whitespace-padded, overlong, and non-conforming values', () => {
    expect(acceptClientRequestId(undefined)).toBeNull();
    expect(acceptClientRequestId('')).toBeNull();
    expect(acceptClientRequestId('  abc')).toBeNull();
    expect(acceptClientRequestId('ab cd')).toBeNull();
    expect(acceptClientRequestId('a\nb')).toBeNull();
    expect(acceptClientRequestId('-leading-dash')).toBeNull();
    expect(acceptClientRequestId('x'.repeat(129))).toBeNull();
    expect(acceptClientRequestId(['a', 'b'])).toBeNull();
  });
});

describe('createRequestContextMiddleware (producer)', () => {
  it('preserves a valid client-supplied X-Request-Id', () => {
    const { request, response, nextCalled } = invoke(
      createRequestContextMiddleware(),
      createMockReq({ headers: { 'x-request-id': 'client-123' } }),
      new MockResponse(),
    );

    expect(request.requestContext.requestId).toBe('client-123');
    expect(request.requestContext.traceId).toBe('client-123');
    expect(response.getHeader('X-Request-Id')).toBe('client-123');
    expect(nextCalled).toBe(true);
  });

  it('never writes deprecated root-level request.id/traceId/startTime projections', () => {
    const { request, response } = invoke(
      createRequestContextMiddleware(),
      createMockReq(),
      new MockResponse(),
    );

    // The middleware's only producer-owned carrier is `requestContext`; the
    // root request object must stay clean (no parallel `id`/`traceId`/
    // `startTime` projections). RefArch R3 P2-4.
    const root = request as unknown as Record<string, unknown>;
    expect(root.id).toBeUndefined();
    expect(root.traceId).toBeUndefined();
    expect(root.startTime).toBeUndefined();
    // The nested requestContext.id property never exists either — the carrier
    // exposes `requestId`, not `id`.
    expect((request.requestContext as unknown as Record<string, unknown>).id).toBeUndefined();
    expect(request.requestContext.requestId).toMatch(UUID_PATTERN);
    expect(response.getHeader('X-Request-Id')).toBe(request.requestContext.requestId);
  });

  it('generates a UUID when the header is missing (traceId === requestId)', () => {
    const { request, response } = invoke(
      createRequestContextMiddleware(),
      createMockReq(),
      new MockResponse(),
    );

    expect(request.requestContext.requestId).toMatch(UUID_PATTERN);
    expect(request.requestContext.traceId).toBe(request.requestContext.requestId);
    expect(response.getHeader('X-Request-Id')).toBe(request.requestContext.requestId);
  });

  it('falls back to a UUID for invalid/duplicate/overlong headers — never a 400', () => {
    for (const header of ['ab cd', 'x'.repeat(129), '']) {
      const { request } = invoke(
        createRequestContextMiddleware(),
        createMockReq({ headers: { 'x-request-id': header } }),
        new MockResponse(),
      );
      expect(request.requestContext.requestId).toMatch(UUID_PATTERN);
    }

    const duplicate = invoke(
      createRequestContextMiddleware(),
      createMockReq({ headers: { 'x-request-id': ['a', 'b'] } }),
      new MockResponse(),
    );
    expect(duplicate.request.requestContext.requestId).toMatch(UUID_PATTERN);
  });

  it('calls the injected idFactory exactly once', () => {
    const idFactory = vi.fn(() => 'factory-id');
    const { request } = invoke(
      createRequestContextMiddleware({ idFactory }),
      createMockReq(),
      new MockResponse(),
    );

    expect(idFactory).toHaveBeenCalledTimes(1);
    expect(request.requestContext.requestId).toBe('factory-id');
  });

  it('sets startedAt from the injected clock and source to http', () => {
    const now = vi.fn(() => 1_700_000_000_123);
    const { request } = invoke(
      createRequestContextMiddleware({ now }),
      createMockReq(),
      new MockResponse(),
    );

    expect(request.requestContext.startedAt).toBe(1_700_000_000_123);
    expect(request.requestContext.source).toBe('http');
  });

  it('sets X-Request-Id before calling next()', () => {
    const middleware = createRequestContextMiddleware();
    const request = createMockReq() as unknown as RequestContextCarrierRequest;
    const response = new MockResponse();
    let observed: string | undefined;

    middleware(
      request as Request,
      response as unknown as Response,
      (() => {
        observed = response.getHeader('X-Request-Id');
      }) as NextFunction,
    );

    expect(observed).toBe(request.requestContext.requestId);
  });
});

describe('createRequestContextMiddleware (terminal lifecycle log)', () => {
  it('logs exactly one terminal entry on finish, with duration from the injected clock', () => {
    const logger = createMockLogger();
    let clock = 1_000;
    const now = vi.fn(() => clock);
    const { response } = invoke(
      createRequestContextMiddleware({ logger, now }),
      createMockReq(),
      new MockResponse(),
    );

    response.statusCode = 201;
    clock = 1_250;
    response.emit('finish');
    response.emit('close');

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
    const [message, metadata] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toBe('request completed');
    expect(metadata).toMatchObject({
      requestId: expect.any(String),
      traceId: expect.any(String),
      source: 'http',
      method: 'GET',
      routeTemplate: '__unmatched__',
      statusCode: 201,
      durationMs: 250,
      outcome: 'finished',
    });
  });

  it('resolves the registered route template with :id params, never the raw path', () => {
    const logger = createMockLogger();
    const now = vi.fn(() => 1_000);
    const { response } = invoke(
      createRequestContextMiddleware({ logger, now }),
      createMockReq({
        method: 'GET',
        path: '/api/goals/goal-123',
        originalUrl: '/api/goals/goal-123?tab=active',
        baseUrl: '/api',
        route: { path: '/goals/:id' },
      }),
      new MockResponse(),
    );

    response.emit('finish');
    const [, metadata] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(metadata.routeTemplate).toBe('/api/goals/:id');
    // Raw path/query never leak into the terminal metadata as a label.
    expect(JSON.stringify(metadata)).not.toContain('goal-123');
    expect(JSON.stringify(metadata)).not.toContain('tab=active');
  });

  it('logs a single aborted entry when the response closes without finishing', () => {
    const logger = createMockLogger();
    let clock = 5_000;
    const now = vi.fn(() => clock);
    const { response } = invoke(
      createRequestContextMiddleware({ logger, now }),
      createMockReq({ method: 'POST' }),
      new MockResponse(),
    );

    clock = 5_123;
    response.emit('close');

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [message, metadata] = (logger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toBe('request aborted');
    expect(metadata).toMatchObject({
      aborted: true,
      outcome: 'aborted',
      method: 'POST',
      routeTemplate: '__unmatched__',
      durationMs: 123,
    });
  });

  it('isolates observer failures so they never change the response', () => {
    const logger = createMockLogger();
    const observer = {
      complete: vi.fn(() => {
        throw new Error('metrics exploded');
      }),
    };
    const { response, nextCalled } = invoke(
      createRequestContextMiddleware({ logger, observer }),
      createMockReq(),
      new MockResponse(),
    );

    response.emit('finish');
    response.emit('close');

    expect(observer.complete).toHaveBeenCalledTimes(1);
    expect(nextCalled).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      'Request observer failed; response unaffected',
      expect.any(Error),
    );
  });

  it('keeps traceId === requestId with the default noop trace', () => {
    const { request } = invoke(
      createRequestContextMiddleware(),
      createMockReq({ headers: { 'x-request-id': 'client-123' } }),
      new MockResponse(),
    );

    expect(request.requestContext.requestId).toBe('client-123');
    expect(request.requestContext.traceId).toBe('client-123');
  });

  it('attaches identityId to the terminal log when the principal is present', () => {
    const logger = createMockLogger();
    const { response } = invoke(
      createRequestContextMiddleware({ logger }),
      createMockReq({ user: { identityId: 'identity-1' } }),
      new MockResponse(),
    );

    response.emit('finish');
    const [, metadata] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(metadata.identityId).toBe('identity-1');
  });

  it('never includes sensitive headers or body in terminal metadata', () => {
    const logger = createMockLogger();
    const { response } = invoke(
      createRequestContextMiddleware({ logger }),
      createMockReq({
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=secret-session',
          'x-api-key': 'secret-key',
        },
        body: { password: 'hunter2', query: 'user input' },
        query: { token: 'secret-query' },
      }),
      new MockResponse(),
    );

    response.emit('finish');
    const [, metadata] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.stringify(metadata)).not.toContain('secret-token');
    expect(JSON.stringify(metadata)).not.toContain('secret-session');
    expect(JSON.stringify(metadata)).not.toContain('secret-key');
    expect(JSON.stringify(metadata)).not.toContain('hunter2');
    expect(JSON.stringify(metadata)).not.toContain('user input');
    expect(JSON.stringify(metadata)).not.toContain('secret-query');
  });

  it('does not mutate response headers after headersSent', () => {
    const logger = createMockLogger();
    const { response } = invoke(
      createRequestContextMiddleware({ logger }),
      createMockReq(),
      new MockResponse(),
    );
    const setHeader = vi.fn(response.setHeader.bind(response));
    response.setHeader = setHeader as MockResponse['setHeader'];
    response.headersSent = true;

    response.emit('finish');
    response.emit('close');

    expect(setHeader).toHaveBeenCalledTimes(0);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});

describe('createRequestContextMiddleware (trace integration)', () => {
  function createFakeTrace() {
    const span = {
      traceId: 'trace-123',
      runWithContext: vi.fn((callback: () => unknown) => callback()),
      complete: vi.fn(),
    } as unknown as HttpRequestSpan;
    const trace = {
      startSpan: vi.fn(() => span),
    } as unknown as HttpRequestTrace;
    return { trace, span };
  }

  it('uses the span traceId when a trace is injected (OTel enabled lane)', () => {
    const { trace } = createFakeTrace();
    const { request } = invoke(
      createRequestContextMiddleware({ trace }),
      createMockReq({ headers: { 'x-request-id': 'client-123' } }),
      new MockResponse(),
    );

    expect(request.requestContext.requestId).toBe('client-123');
    expect(request.requestContext.traceId).toBe('trace-123');
  });

  it('runs next() inside the span context and ends the span from the terminal observation', () => {
    const { trace, span } = createFakeTrace();
    const { response, nextCalled } = invoke(
      createRequestContextMiddleware({ trace }),
      createMockReq({ method: 'POST' }),
      new MockResponse(),
    );

    expect(span.runWithContext).toHaveBeenCalledTimes(1);
    expect(nextCalled).toBe(true);

    response.statusCode = 204;
    response.emit('finish');
    response.emit('close');

    expect(span.complete).toHaveBeenCalledTimes(1);
    const observation = (span.complete as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as HttpRequestObservation;
    expect(observation).toMatchObject({
      method: 'POST',
      statusCode: 204,
      outcome: 'finished',
      traceId: 'trace-123',
    });
  });

  it('settles the span as aborted on close-without-finish (SSE disconnect)', () => {
    const { trace, span } = createFakeTrace();
    const { response } = invoke(
      createRequestContextMiddleware({ trace }),
      createMockReq(),
      new MockResponse(),
    );

    response.emit('close');
    const observation = (span.complete as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as HttpRequestObservation;
    expect(observation.outcome).toBe('aborted');
  });

  it('isolates span failures so they never change the response', () => {
    const span = {
      traceId: 'trace-123',
      runWithContext: vi.fn((callback: () => unknown) => callback()),
      complete: vi.fn(() => {
        throw new Error('exporter down');
      }),
    } as unknown as HttpRequestSpan;
    const trace = { startSpan: vi.fn(() => span) } as unknown as HttpRequestTrace;
    const logger = createMockLogger();
    const { response, nextCalled } = invoke(
      createRequestContextMiddleware({ logger, trace }),
      createMockReq(),
      new MockResponse(),
    );

    response.emit('finish');

    expect(nextCalled).toBe(true);
    expect(span.complete).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Request span failed; response unaffected',
      expect.any(Error),
    );
  });
});
