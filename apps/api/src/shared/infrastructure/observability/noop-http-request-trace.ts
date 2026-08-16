/**
 * Noop HTTP request trace (RefArch Phase 6).
 * Noop HTTP request trace（RefArch 阶段 6）。
 *
 * Default trace implementation: allocates no SDK objects, sends no network
 * requests, exposes no trace ID (the middleware falls back to
 * `traceId === requestId`) and runs continuations in the ambient context.
 *
 * 默认 trace 实现：不分配 SDK 对象、不发网络请求、不暴露 trace ID
 * （middleware 回退为 `traceId === requestId`），并在当前 context 中运行续体。
 */

import type { Request } from 'express';
import type { HttpRequestSpan, HttpRequestTrace } from './http-request-trace';
import type { HttpRequestObservation } from './http-request-observation';

/**
 * Default noop span. `complete()` is a no-op and `traceId` is always undefined.
 * 默认 noop span。`complete()` 为 no-op，`traceId` 恒为 `undefined`。
 */
class NoopHttpRequestSpan implements HttpRequestSpan {
  readonly traceId: string | undefined = undefined;

  runWithContext<T>(callback: () => T): T {
    return callback();
  }

  complete(_observation: HttpRequestObservation): void {
    // Intentionally nothing: disabled tracing must not allocate SDK state.
    // 有意不做任何事：禁用 tracing 时不得分配 SDK 状态。
  }
}

/**
 * Noop trace Port used when OpenTelemetry is disabled (the default).
 * OpenTelemetry 禁用时（默认）使用的 noop trace Port。
 */
export class NoopHttpRequestTrace implements HttpRequestTrace {
  startSpan(_request: Request): HttpRequestSpan {
    return new NoopHttpRequestSpan();
  }
}

/**
 * Shared noop trace instance (stateless, safe to reuse across middleware).
 * 共享 noop trace 实例（无状态，可安全复用于各 middleware）。
 */
export const NOOP_HTTP_REQUEST_TRACE = new NoopHttpRequestTrace();
