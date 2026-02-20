/**
 * Express Adapter
 *
 * 将 Controller 函数适配为 Express 路由处理器。
 * 统一处理上下文提取、错误处理和响应格式化。
 *
 * 所有 Zod 验证必须在 Controller 内部完成（Plan B 策略）。
 *
 * @module @dailyuse/utils/result/express-adapter
 *
 * @example
 * ```ts
 * import { expressAdapter } from '@dailyuse/utils/result';
 *
 * // Controller handles validation internally
 * router.post('/', auth, expressAdapter(
 *   (req, ctx) => controller.create(req.body, ctx),
 *   { successStatus: 201 },
 * ));
 *
 * router.get('/:id', auth, expressAdapter(
 *   (req, ctx) => controller.get(req.params.id),
 * ));
 * ```
 */

import {
  type Result,
  type ResultErrorDetail,
  isOk,
  errorCodeToHttpStatus,
  createHttpResponseBuilder,
} from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';

// ============================================================================
// Types
// ============================================================================

/**
 * Express-like Request interface (avoid hard Express dependency)
 */
interface ExpressLikeRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  user?: {
    identityId?: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
  id?: string;
  traceId?: string;
  startTime?: number;
}

/**
 * Express-like Response interface (avoid hard Express dependency)
 */
interface ExpressLikeResponse {
  status(code: number): this;
  json(data: unknown): this;
}

/**
 * Options for the Express adapter
 */
export interface ExpressAdapterOptions {
  /** HTTP status code for successful responses (default: 200) */
  successStatus?: number;
  /** Custom context extractor */
  extractContext?: (req: ExpressLikeRequest) => Context;
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
}

// ============================================================================
// Default Helpers
// ============================================================================

/**
 * Default context extractor from Express request
 */
function defaultExtractContext(req: ExpressLikeRequest): Context {
  return {
    identityId: req.user?.identityId ?? '',
    deviceId: (req.headers?.['x-device-id'] as string) || 'unknown',
  };
}

/**
 * Format Zod issues into ResultErrorDetail array
 */
export function formatZodErrors(issues: Array<{ path: PropertyKey[]; message: string }>): ResultErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.map(String).join('.'),
    code: 'INVALID_FIELD',
    message: issue.message,
  }));
}

// ============================================================================
// Express Adapters
// ============================================================================

/**
 * Adapt a controller function to an Express route handler.
 *
 * Use this for routes that do NOT need body validation (GET, DELETE, etc.),
 * or when validation is handled inside the controller.
 *
 * The controller receives the full request object and the extracted context.
 *
 * @example
 * ```ts
 * router.get('/:id', auth, expressAdapter(
 *   (req, ctx) => handlers.getGoal.execute(req.params.id),
 * ));
 *
 * router.delete('/:id', auth, expressAdapter(
 *   (req, ctx) => handlers.deleteGoal.execute(req.params.id),
 * ));
 * ```
 */
export function expressAdapter<T>(
  controllerFn: (req: ExpressLikeRequest, context: Context) => Promise<Result<T>>,
  options: ExpressAdapterOptions = {},
): (req: ExpressLikeRequest, res: ExpressLikeResponse) => Promise<void> {
  const {
    successStatus = 200,
    extractContext = defaultExtractContext,
    requireAuth = true,
  } = options;

  return async (req: ExpressLikeRequest, res: ExpressLikeResponse) => {
    const traceId = req.traceId ?? req.id;
    const startTime = req.startTime ?? Date.now();
    const responseBuilder = createHttpResponseBuilder({ traceId, startTime });

    try {
      // Auth check
      if (requireAuth && !req.user?.identityId) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const context = extractContext(req);
      const result = await controllerFn(req, context);

      if (isOk(result)) {
        res.status(successStatus).json(responseBuilder.success(result.data as T));
      } else {
        const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
        res.status(status).json(responseBuilder.fromResult(result));
      }
    } catch (err) {
      // Recognize DomainError (or any Error with a string `code`) and map properly
      if (err instanceof Error && 'code' in err && typeof (err as Record<string, unknown>).code === 'string') {
        const code = (err as Record<string, unknown>).code as string;
        const status = errorCodeToHttpStatus(code);
        res.status(status).json(responseBuilder.error(code, err.message));
      } else {
        res.status(500).json(responseBuilder.internalError(
          err instanceof Error ? err.message : 'Internal server error',
        ));
      }
    }
  };
}
