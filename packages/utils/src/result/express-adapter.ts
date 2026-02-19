/**
 * Express Adapter
 *
 * 将 Controller/UseCase 函数适配为 Express 路由处理器。
 * 统一处理 Zod 验证、上下文提取、错误处理和响应格式化。
 *
 * @module @dailyuse/utils/result/express-adapter
 *
 * @example
 * ```ts
 * import { expressAdapter, expressAdapterWithValidation } from '@dailyuse/utils/result';
 *
 * // 无验证（适用于无 body 的 GET/DELETE）
 * router.get('/:id', auth, expressAdapter(
 *   (req, ctx) => handlers.getGoal.execute(req.params.id),
 * ));
 *
 * // 带 Zod 验证（适用于 POST/PUT/PATCH）
 * router.post('/', auth, expressAdapterWithValidation(
 *   CreateGoalSchema,
 *   (data, ctx, req) => handlers.createGoal.execute(data, ctx),
 *   { successStatus: 201 },
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
 * Zod-like schema interface (avoid hard Zod dependency)
 */
interface ZodLikeSchema<T = unknown> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } };
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
export function formatZodErrors(issues: Array<{ path: (string | number)[]; message: string }>): ResultErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
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
      res.status(500).json(responseBuilder.internalError(
        err instanceof Error ? err.message : 'Internal server error',
      ));
    }
  };
}

/**
 * Adapt a controller function with Zod validation to an Express route handler.
 *
 * Automatically validates `req.body` against the provided Zod schema,
 * extracts the context, and formats errors consistently.
 *
 * @example
 * ```ts
 * router.post('/', auth, expressAdapterWithValidation(
 *   CreateGoalSchema,
 *   (data, ctx) => handlers.createGoal.execute(data, ctx),
 *   { successStatus: 201 },
 * ));
 *
 * router.put('/:id', auth, expressAdapterWithValidation(
 *   UpdateGoalSchema,
 *   (data, ctx, req) => handlers.updateGoal.execute(req.params.id, data),
 * ));
 * ```
 */
export function expressAdapterWithValidation<T, S>(
  schema: ZodLikeSchema<S>,
  controllerFn: (data: S, context: Context, req: ExpressLikeRequest) => Promise<Result<T>>,
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
      // Validate input
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const details = formatZodErrors(parsed.error.issues);
        res.status(400).json(responseBuilder.validationError(details));
        return;
      }

      // Auth check
      if (requireAuth && !req.user?.identityId) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const context = extractContext(req);
      const result = await controllerFn(parsed.data, context, req);

      if (isOk(result)) {
        res.status(successStatus).json(responseBuilder.success(result.data as T));
      } else {
        const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
        res.status(status).json(responseBuilder.fromResult(result));
      }
    } catch (err) {
      res.status(500).json(responseBuilder.internalError(
        err instanceof Error ? err.message : 'Internal server error',
      ));
    }
  };
}
