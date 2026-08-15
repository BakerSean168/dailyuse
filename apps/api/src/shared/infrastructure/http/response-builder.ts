import { createHttpResponseBuilder } from '@memoflow/contracts/result';
import type { RequestContext } from '@memoflow/contracts/shared';

/**
 * Residual 1171 keep-boundary: API response-builder readString — single record key, empty string allowed.
 * Soft residual 1171: AI result-client-error readString uses dotted path + non-empty filter (no force-merge).
 */
function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Builds an HttpResponse envelope for one HTTP attempt.
 * 为单次 HTTP 请求构建 HttpResponse envelope。
 *
 * RefArch Phase 2: the producer-owned carrier (`req.requestContext`) is the
 * source of `traceId`/`startedAt`. The `req.traceId`/`req.id`/`req.startTime`
 * fallbacks are short-term compatibility only and must not be relied on by new
 * callers (the request-context middleware sets them as deprecated projections).
 *
 * RefArch 阶段 2：`req.requestContext` 是 `traceId`/`startedAt` 的来源。
 * `req.traceId`/`req.id`/`req.startTime` 仅作短期兼容回退，新调用方不得依赖
 * （request-context middleware 会以 deprecated 投影写入它们）。
 */
export function createApiResponseBuilder(req?: unknown) {
  const request = req && typeof req === 'object' ? (req as Record<string, unknown>) : {};
  const requestContext =
    request.requestContext && typeof request.requestContext === 'object'
      ? (request.requestContext as RequestContext)
      : undefined;

  return createHttpResponseBuilder({
    traceId:
      requestContext?.traceId ??
      readString(request, 'traceId') ??
      readString(request, 'id'),
    startTime:
      requestContext?.startedAt ??
      readNumber(request, 'startTime') ??
      Date.now(),
  });
}
