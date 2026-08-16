/**
 * OpenTelemetry HTTP request trace (RefArch Phase 6).
 * OpenTelemetry HTTP request trace（RefArch 阶段 6）。
 *
 * Opt-in implementation used only when `OTEL_TRACING_ENABLED=1`. One SERVER
 * span is created per HTTP attempt; a valid incoming W3C context is continued,
 * otherwise a new root span starts. `complete()` sets HTTP semantic
 * attributes, route template, status/outcome and request ID, marks errors for
 * aborts and >=400 responses, and ends the span. Sensitive fields (body, query,
 * headers, identity) never reach span attributes.
 *
 * opt-in 实现，仅在 `OTEL_TRACING_ENABLED=1` 时使用。每次 HTTP attempt 创建
 * 一个 SERVER span；有效的 incoming W3C context 被继续，否则创建新 root
 * span。`complete()` 设置 HTTP semantic attributes、route template、
 * status/outcome 与 request ID，对 abort 与 >=400 响应标记 error，并结束
 * span。敏感字段（body、query、headers、identity）绝不进入 span attributes。
 */

import { context, propagation, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import type { Request } from 'express';
import type { HttpRequestSpan, HttpRequestTrace } from './http-request-trace';
import type { HttpRequestObservation } from './http-request-observation';

/** Tracer name for the API host. API 宿主的 tracer 名称。 */
const TRACER_NAME = 'memoflow-api';

/** Custom attribute carrying the canonical request ID (no semantic-convention
 *  exists for it). 携带规范 request ID 的自定义 attribute。 */
const REQUEST_ID_ATTRIBUTE = 'memoflow.request_id';

/**
 * Wraps a live OTel `Span` as an `HttpRequestSpan`.
 * 将实时 OTel `Span` 包装为 `HttpRequestSpan`。
 */
class OTelHttpRequestSpan implements HttpRequestSpan {
  private readonly span: Span;

  constructor(span: Span) {
    this.span = span;
  }

  get traceId(): string | undefined {
    return this.span.spanContext().traceId || undefined;
  }

  runWithContext<T>(callback: () => T): T {
    const ctx = trace.setSpan(context.active(), this.span);
    return context.with(ctx, callback);
  }

  complete(observation: HttpRequestObservation): void {
    const span = this.span;
    span.setAttribute(SemanticAttributes.HTTP_ROUTE, observation.routeTemplate);
    span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, observation.statusCode);
    span.setAttribute('http.outcome', observation.outcome);
    span.setAttribute(REQUEST_ID_ATTRIBUTE, observation.requestId);
    span.updateName(`${observation.method} ${observation.routeTemplate}`);

    if (observation.outcome === 'aborted' || observation.statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    span.end();
  }
}

/**
 * OTel-backed `HttpRequestTrace` for the opt-in tracing lane.
 * opt-in tracing lane 的 OTel-backed `HttpRequestTrace`。
 */
export class OpenTelemetryHttpRequestTrace implements HttpRequestTrace {
  startSpan(request: Request): HttpRequestSpan {
    const tracer = trace.getTracer(TRACER_NAME);
    const parentContext = propagation.extract(context.active(), request.headers);
    const span = tracer.startSpan(
      request.method,
      {
        kind: SpanKind.SERVER,
        attributes: {
          [SemanticAttributes.HTTP_METHOD]: request.method,
        },
      },
      parentContext,
    );
    return new OTelHttpRequestSpan(span);
  }
}
