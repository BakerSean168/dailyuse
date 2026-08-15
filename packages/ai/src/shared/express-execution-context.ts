/**
 * Shared Express execution-context extractor for custom AI routes (SSE etc.)
 * that cannot be wrapped by `expressAdapter`.
 * 供无法被 `expressAdapter` 包裹的自定义 AI 路由（如 SSE）使用的共享
 * Express execution-context extractor。
 *
 * It composes the producer-owned `req.requestContext` carrier with the
 * auth-resolved `req.user.identityId`. It NEVER mints a request ID — if the
 * global RequestContext middleware did not run, it fails closed.
 *
 * 该 extractor 把 producer-owned `req.requestContext` carrier 与
 * auth-resolved `req.user.identityId` 合成完整 context。它绝不生成 request ID —
 * 若全局 RequestContext middleware 未运行，则 fail closed。
 */

import type { ExecutionContext, RequestContext } from '@memoflow/contracts/shared';

/**
 * Express-like request shape consumed by the shared extractor.
 * 共享 extractor 消费的 Express-like request shape。
 */
export interface AiExpressRequestLike {
  /** Producer-owned canonical request metadata (RequestContext middleware). */
  requestContext?: RequestContext;
  /** Auth-resolved principal representation (`req.user`). */
  user?: { identityId?: string };
}

function asRequestLike(req: unknown): AiExpressRequestLike {
  return (req ?? {}) as AiExpressRequestLike;
}

/**
 * Reads the producer-owned carrier, failing closed when the global
 * RequestContext middleware was not mounted. Never generates a second ID.
 * 读取 producer-owned carrier；缺失时 fail closed，绝不生成第二个 ID。
 *
 * Accepts a real Express `Request` (or a structural equivalent in tests).
 *
 * @throws Error when `req.requestContext` is missing.
 */
export function readAiExpressRequestContext(req: unknown): RequestContext {
  const requestContext = asRequestLike(req).requestContext;
  if (!requestContext) {
    throw new Error(
      'Missing RequestContext carrier: mount the global request-context middleware before custom AI routes',
    );
  }
  return requestContext;
}

/**
 * Composes the canonical `ExecutionContext` for a custom AI route.
 * 为自定义 AI 路由合成 canonical `ExecutionContext`。
 *
 * The principal identity comes from `req.user` (parsed once by the auth
 * middleware); when absent the route is expected to reject with 401 itself.
 *
 * @param req - The Express request (or a structural equivalent in tests).
 * @returns A full `ExecutionContext` (carrier + identity).
 */
export function extractAiExpressExecutionContext(req: unknown): ExecutionContext {
  const requestContext = readAiExpressRequestContext(req);
  return {
    ...requestContext,
    identityId: asRequestLike(req).user?.identityId ?? '',
  };
}

/**
 * Reads the envelope trace/start for a custom AI route from the canonical
 * carrier, so SSE/auth-error envelopes share the entry request ID.
 * 从 canonical carrier 读取自定义 AI 路由的 envelope trace/start，使
 * SSE/鉴权错误 envelope 与入口 request ID 一致。
 *
 * @param req - The Express request (or a structural equivalent in tests).
 */
export function readAiExpressEnvelopeMeta(req: unknown): {
  traceId?: string;
  startTime?: number;
} {
  const requestContext = readAiExpressRequestContext(req);
  return {
    traceId: requestContext.traceId,
    startTime: requestContext.startedAt,
  };
}
