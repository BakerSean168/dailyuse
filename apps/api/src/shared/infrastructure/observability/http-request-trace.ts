/**
 * HTTP request trace Port (RefArch Phase 6).
 * HTTP 请求 trace Port（RefArch 阶段 6）。
 *
 * The API platform owns the trace seam; feature packages never import an SDK.
 * A default no-op implementation allocates no SDK objects and never sends
 * network requests, so production runs with zero collector dependency unless
 * `OTEL_TRACING_ENABLED=1` is explicitly set.
 *
 * API platform 拥有 trace seam；feature 包绝不 import SDK。默认 no-op 实现不
 * 分配任何 SDK 对象、不发任何网络请求，因此除非显式设置
 * `OTEL_TRACING_ENABLED=1`，生产运行零 collector 依赖。
 */

import type { Request } from 'express';
import type { HttpRequestObserver } from './http-request-observation';

/**
 * A span handle for one HTTP attempt.
 * 单次 HTTP attempt 的 span 句柄。
 *
 * `traceId` is `undefined` when tracing is disabled (the RequestContext keeps
 * `traceId === requestId`, matching ADR-045). `runWithContext` executes the
 * request continuation inside the active span so W3C headers can propagate to
 * internal calls (for example the Python AI service).
 *
 * `traceId` 在禁用 tracing 时为 `undefined`（RequestContext 保持
 * `traceId === requestId`，符合 ADR-045）。`runWithContext` 在 active span
 * 内执行请求续体，使 W3C headers 能透传到内部调用（例如 Python AI service）。
 */
export interface HttpRequestSpan extends HttpRequestObserver {
  /** Valid OTel trace ID when tracing is enabled, else `undefined`. */
  readonly traceId: string | undefined;
  /**
   * Runs a callback inside the active span context (identity when disabled).
   * 在 active span context 内运行回调（禁用时为恒等操作）。
   */
  runWithContext<T>(callback: () => T): T;
}

/**
 * Trace Port creating one server span per HTTP attempt.
 * 为每次 HTTP attempt 创建 server span 的 trace Port。
 */
export interface HttpRequestTrace {
  /**
   * Starts the span for a request. The span's `complete()` sets the status and
   * ends the span from the terminal observation.
   *
   * 为请求启动 span。span 的 `complete()` 根据 terminal observation 设置状态
   * 并结束 span。
   *
   * @param request - The Express request (headers read only for W3C extraction).
   * @returns A span handle for the attempt.
   */
  startSpan(request: Request): HttpRequestSpan;
}
