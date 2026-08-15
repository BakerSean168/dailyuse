/**
 * Request Context Middleware
 * 请求上下文中间件
 *
 * RefArch Phase 2: the single producer of canonical `RequestContext` metadata
 * for every HTTP attempt. It runs as the FIRST global `app.use`, before
 * Helmet/CORS/body-parser/compression/performance, so every downstream response
 * type (JSON, 204, auth failure, 404, 500, SSE `flushHeaders()`) shares the
 * same `X-Request-Id`, `traceId` and `startedAt`.
 *
 * RefArch 阶段 2：HTTP 每次请求统一请求元数据的唯一 producer。它作为第一个
 * 全局 `app.use` 运行，早于 Helmet/CORS/body 解析/compression/performance，
 * 因此所有下游响应（JSON、204、鉴权失败、404、500、SSE `flushHeaders()`）
 * 都共享同一个 `X-Request-Id`、`traceId` 与 `startedAt`。
 *
 * The middleware is identity-agnostic: it never reads Authorization/cookies and
 * never resolves a Principal. The Cloud Auth middleware parses the principal
 * later, and the Express adapter composes the full `ExecutionContext`.
 *
 * 本中间件与身份无关：不读取 Authorization/cookie，也不解析 Principal。
 * Cloud Auth 中间件在其后解析 principal，由 Express adapter 合成完整
 * `ExecutionContext`。
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { RequestContext } from '@memoflow/contracts/shared';
import { createLogger, type ILogger } from '@memoflow/utils/logger';

/**
 * Pattern for accepting a client/proxy-supplied `X-Request-Id`.
 * 接受 client/proxy 提供的 `X-Request-Id` 的匹配规则。
 *
 * Trimmed value must start with an alphanumeric char and continue with up to
 * 127 chars of `[A-Za-z0-9._:-]` (total max length 128).
 */
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

/**
 * Express Request augmented with the producer-owned carrier.
 * 携带 producer-owned carrier 的 Express Request 类型。
 *
 * `requestContext` is the single producer-owned carrier; downstream callers
 * (envelope, error handler, SSE routes) read `requestContext.*` only — there are
 * no deprecated projections.
 *
 * `requestContext` 是唯一 producer-owned carrier；下游调用方（envelope、error
 * handler、SSE 路由）只读取 `requestContext.*`，没有 deprecated 投影。
 */
export interface RequestContextCarrierRequest extends Request {
  /**
   * Canonical per-request metadata produced once by
   * `createRequestContextMiddleware`.
   * 由 `createRequestContextMiddleware` 生成一次的规范请求元数据。
   */
  requestContext: RequestContext;
}

/**
 * Options for `createRequestContextMiddleware`.
 * `createRequestContextMiddleware` 的选项。
 */
export interface RequestContextMiddlewareOptions {
  /**
   * Request ID factory. Defaults to `node:crypto` `randomUUID`.
   * 请求 ID 工厂，默认使用 `node:crypto` 的 `randomUUID`。
   */
  readonly idFactory?: () => string;
  /**
   * Clock used for `startedAt` and terminal log durations. Defaults to
   * `Date.now`. Returns Unix epoch milliseconds.
   * 用于 `startedAt` 与日志时长的时钟，默认 `Date.now`；返回 Unix epoch 毫秒。
   */
  readonly now?: () => number;
  /**
   * Structured logger for the single terminal request log. Defaults to a
   * `RequestContext` logger.
   * 负责唯一 terminal request log 的结构化 logger，默认创建 `RequestContext` logger。
   */
  readonly logger?: ILogger;
}

/**
 * Accepts a client-supplied request ID when it is a single string that, after
 * trimming, matches the allowlist. Everything else (missing, array/duplicate,
 * empty, whitespace/control chars, too long, non-ASCII) falls back to `null`
 * and the middleware generates a UUID instead — never a 400.
 *
 * 仅当 header 是单个字符串且 trim 后匹配 allowlist 时才接受；其它情况
 * （缺失、数组/重复、空、空白/控制字符、超长、非 ASCII）一律回退为 `null`
 * 并由中间件生成 UUID，绝不返回 400。
 *
 * @param value - Raw `x-request-id` header value.
 * @returns The accepted trimmed ID, or `null` to trigger UUID fallback.
 */
export function acceptClientRequestId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed !== value) return null;
  return CLIENT_REQUEST_ID_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Creates the global RequestContext middleware.
 * 创建全局 RequestContext 中间件。
 *
 * @param options - Factory options (idFactory / clock / logger) for testability.
 * @returns An Express request handler.
 */
export function createRequestContextMiddleware(
  options: RequestContextMiddlewareOptions = {},
): RequestHandler {
  const idFactory = options.idFactory ?? randomUUID;
  const now = options.now ?? Date.now;
  const logger = options.logger ?? createLogger('RequestContext');

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = acceptClientRequestId(req.headers['x-request-id']) ?? idFactory();
    const startedAt = now();
    const requestContext: RequestContext = {
      requestId,
      traceId: requestId,
      startedAt,
      source: 'http',
    };

    const request = req as RequestContextCarrierRequest;
    request.requestContext = requestContext;

    // Set before next() so every downstream response type echoes the same ID.
    res.setHeader('X-Request-Id', requestId);

    let terminalLogged = false;
    const logTerminal = (outcome: 'finished' | 'aborted'): void => {
      if (terminalLogged) return;
      terminalLogged = true;

      const durationMs = now() - startedAt;
      const identityId = (req as { user?: { identityId?: string } }).user?.identityId;
      const metadata: Record<string, unknown> = {
        requestId,
        traceId: requestId,
        source: 'http',
        method: req.method,
        path: req.route?.path ?? req.path,
        statusCode: res.statusCode,
        durationMs,
      };
      if (identityId) {
        metadata.identityId = identityId;
      }

      if (outcome === 'finished') {
        logger.info('request completed', metadata);
      } else {
        logger.warn('request aborted', { ...metadata, aborted: true });
      }
    };

    res.on('finish', () => logTerminal('finished'));
    res.on('close', () => logTerminal('aborted'));

    next();
  };
}
