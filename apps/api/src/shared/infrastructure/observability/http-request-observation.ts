/**
 * HTTP request observation contract (RefArch Phase 6).
 * HTTP 请求观察契约（RefArch 阶段 6）。
 *
 * A single terminal settlement per HTTP attempt produces one
 * `HttpRequestObservation` consumed by every terminal consumer: the structured
 * request logger, the bounded metrics recorder and (opt-in) the trace span.
 * The route template is resolved from the Express registered route pattern at
 * terminal time — never from the raw URL — so label cardinality stays bounded.
 *
 * 每次 HTTP attempt 只结算一次，产生单个 `HttpRequestObservation`，由所有
 * terminal 消费者消费：结构化 request logger、有界 metrics recorder 以及
 * （opt-in）trace span。route template 在 terminal 时刻从 Express 已注册的
 * route pattern 解析，绝不使用 raw URL，因此 label 基数保持有界。
 */

import { createLogger, type ILogger } from '@memoflow/utils/logger';

/**
 * Terminal outcome of an HTTP attempt.
 * 一次 HTTP attempt 的终态结果。
 */
export type HttpRequestOutcome = 'finished' | 'aborted';

/**
 * Canonical, low-cardinality, terminal facts about one HTTP attempt.
 * 一次 HTTP attempt 的规范、低基数、终态事实。
 *
 * `identityId` may only reach access-log metadata, never a metrics label or a
 * span attribute. `routeTemplate` comes from the Express registered route
 * pattern plus mount path, keeping `:id` parameters and removing the query.
 *
 * `identityId` 只能进入 access log metadata，绝不进入 metrics label 或 span
 * attribute。`routeTemplate` 来自 Express 已注册的 route pattern 加 mount
 * path，保留 `:id` 参数并移除 query。
 */
export interface HttpRequestObservation {
  /** Canonical request ID (client-supplied or generated UUID). 规范请求 ID。 */
  readonly requestId: string;
  /** Trace ID — equals `requestId` unless OpenTelemetry is explicitly enabled. */
  readonly traceId: string;
  /** HTTP method verb (e.g. `GET`). HTTP 方法动词。 */
  readonly method: string;
  /** Registered route template with mount path, or `__unmatched__`. */
  readonly routeTemplate: string;
  /** Actual three-digit HTTP status code. 实际三位 HTTP 状态码。 */
  readonly statusCode: number;
  /** Whether the response finished or was aborted mid-flight. */
  readonly outcome: HttpRequestOutcome;
  /** Duration from the canonical `RequestContext.startedAt` in milliseconds. */
  readonly durationMs: number;
  /** Principal identity, access-log-only. 仅限 access log 的身份标识。 */
  readonly identityId?: string;
}

/**
 * Terminal observer for one HTTP attempt.
 * 单次 HTTP attempt 的 terminal observer。
 */
export interface HttpRequestObserver {
  /**
   * Settles the attempt with a terminal observation. Implementations must not
   * throw into the request pipeline; the platform isolates observer failures.
   *
   * 用 terminal observation 结算该 attempt。实现不得向请求管线抛错；
   * platform 负责隔离 observer 失败。
   *
   * @param observation - Canonical terminal facts about the attempt.
   */
  complete(observation: HttpRequestObservation): void;
}

/**
 * Fixed fallback route template when no Express route matched (404) or the
 * route pattern is unavailable. Raw URLs must never be used as a label.
 *
 * 当没有 Express route 匹配（404）或 route pattern 不可用时使用的固定回退
 * template。raw URL 绝不能被用作 label。
 */
export const UNMATCHED_ROUTE_TEMPLATE = '__unmatched__';

/**
 * Resolves the bounded route template for the current Express request.
 * 解析当前 Express 请求的有界 route template。
 *
 * Uses the registered route pattern (`req.route.path`) plus the router mount
 * path (`req.baseUrl`), keeping `:id` parameters. When no route matched, the
 * fixed `UNMATCHED_ROUTE_TEMPLATE` is returned — the raw path/URL is never
 * used, so entity IDs can never reach metric labels.
 *
 * 使用已注册 route pattern（`req.route.path`）加 router mount path
 * （`req.baseUrl`），保留 `:id` 参数。没有 route 匹配时返回固定的
 * `UNMATCHED_ROUTE_TEMPLATE`——绝不使用 raw path/URL，因此实体 ID 永远不会
 * 进入 metric label。
 *
 * @param req - The Express request (minimal structural type for testability).
 * @returns The bounded route template.
 */
export function resolveRouteTemplate(req: { baseUrl?: string; route?: { path?: string } }): string {
  const routePath = req.route?.path;
  if (typeof routePath !== 'string' || routePath.length === 0) {
    return UNMATCHED_ROUTE_TEMPLATE;
  }

  const mount = (req.baseUrl && req.baseUrl !== '/' ? req.baseUrl : '').replace(/\/+$/, '');
  if (routePath === '/') {
    return mount.length > 0 ? mount : '/';
  }
  return `${mount}${routePath}`;
}

/**
 * Creates an observer that writes the single terminal structured request log.
 * 创建写入唯一 terminal 结构化 request log 的 observer。
 *
 * @param logger - Structured logger; defaults to a `RequestContext` logger.
 * @returns An `HttpRequestObserver` that logs completion/abort entries.
 */
export function createHttpRequestLoggerObserver(
  logger: ILogger = createLogger('RequestContext'),
): HttpRequestObserver {
  return {
    complete(observation) {
      if (observation.outcome === 'aborted') {
        logger.warn('request aborted', { ...observation, source: 'http', aborted: true });
      } else {
        logger.info('request completed', { ...observation, source: 'http' });
      }
    },
  };
}

/**
 * Fans an observation out to every registered observer, isolating failures so
 * one broken consumer (metrics/exporter) can never affect the HTTP response.
 *
 * 将 observation 分发到所有已注册 observer，隔离失败——一个异常的消费者
 * （metrics/exporter）绝不能影响 HTTP 响应。
 *
 * @param observers - Observers invoked in order; a throwing observer is reported
 *   via the platform logger and skipped.
 * @param logger - Platform logger used to report observer failures.
 * @returns A fan-out `HttpRequestObserver`.
 */
export function createObserverFanout(
  observers: readonly HttpRequestObserver[],
  logger: ILogger = createLogger('RequestObserver'),
): HttpRequestObserver {
  return {
    complete(observation) {
      for (const observer of observers) {
        try {
          observer.complete(observation);
        } catch (error) {
          logger.error('Request observer failed; response unaffected', error);
        }
      }
    },
  };
}
