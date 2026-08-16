/**
 * Specs for the HTTP request observation contract (RefArch Phase 6).
 * HTTP 请求观察契约的规格（RefArch 阶段 6）。
 *
 * Locks the bounded route-template resolver, the logger observer and the
 * failure-isolating fan-out.
 *
 * 锁定有界 route-template resolver、logger observer 与失败隔离的 fan-out。
 */

import { describe, expect, it, vi } from 'vitest';
import type { ILogger } from '@memoflow/utils/logger';
import {
  createHttpRequestLoggerObserver,
  createObserverFanout,
  resolveRouteTemplate,
  UNMATCHED_ROUTE_TEMPLATE,
  type HttpRequestObservation,
} from './http-request-observation';

function observation(overrides: Partial<HttpRequestObservation> = {}): HttpRequestObservation {
  return {
    requestId: 'req-1',
    traceId: 'req-1',
    method: 'GET',
    routeTemplate: '/api/goals/:id',
    statusCode: 200,
    outcome: 'finished',
    durationMs: 10,
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

describe('resolveRouteTemplate (bounded labels)', () => {
  it('combines the registered route pattern with the mount path, keeping :id params', () => {
    expect(resolveRouteTemplate({ baseUrl: '/api', route: { path: '/goals/:id' } })).toBe(
      '/api/goals/:id',
    );
    expect(resolveRouteTemplate({ baseUrl: '/api/v1', route: { path: '/goals/:id' } })).toBe(
      '/api/v1/goals/:id',
    );
  });

  it('handles the root route path without duplicating slashes', () => {
    expect(resolveRouteTemplate({ baseUrl: '/api', route: { path: '/' } })).toBe('/api');
    expect(resolveRouteTemplate({ baseUrl: '', route: { path: '/' } })).toBe('/');
  });

  it('normalizes a trailing slash on the mount path', () => {
    expect(resolveRouteTemplate({ baseUrl: '/api/', route: { path: '/goals' } })).toBe(
      '/api/goals',
    );
  });

  it('returns the fixed __unmatched__ fallback when no route matched, never the raw path', () => {
    // The resolver only accepts the registered route pattern; raw URL/path
    // inputs are not even part of the signature, so they can never become labels.
    expect(resolveRouteTemplate({ baseUrl: '/api', route: undefined })).toBe(
      UNMATCHED_ROUTE_TEMPLATE,
    );
    expect(resolveRouteTemplate({ baseUrl: '/api', route: { path: '' } })).toBe(
      UNMATCHED_ROUTE_TEMPLATE,
    );
  });
});

describe('createHttpRequestLoggerObserver', () => {
  it('logs request completed on finished outcomes', () => {
    const logger = createMockLogger();
    createHttpRequestLoggerObserver(logger).complete(observation({ outcome: 'finished' }));

    expect(logger.info).toHaveBeenCalledWith(
      'request completed',
      expect.objectContaining({
        routeTemplate: '/api/goals/:id',
        outcome: 'finished',
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs request aborted with the aborted flag on aborted outcomes', () => {
    const logger = createMockLogger();
    createHttpRequestLoggerObserver(logger).complete(
      observation({ outcome: 'aborted', statusCode: 200 }),
    );

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'request aborted',
      expect.objectContaining({ aborted: true, outcome: 'aborted' }),
    );
  });
});

describe('createObserverFanout (failure isolation)', () => {
  it('fans out to every observer and isolates a throwing observer', () => {
    const logger = createMockLogger();
    const throwing = {
      complete: vi.fn(() => {
        throw new Error('exporter down');
      }),
    };
    const healthy = { complete: vi.fn() };
    const fanout = createObserverFanout([throwing, healthy], logger);

    fanout.complete(observation());

    expect(throwing.complete).toHaveBeenCalledTimes(1);
    expect(healthy.complete).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Request observer failed; response unaffected',
      expect.any(Error),
    );
  });
});
