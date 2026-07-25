/**
 * Express Adapter
 *
 * 将 Controller 函数适配为 Express 路由处理器。
 * 统一处理上下文提取、错误处理和响应格式化。
 *
 * Two variants:
 *   - `expressAdapter`                 — Controller receives raw (req, ctx)
 *   - `expressAdapterWithValidation`  — Validates req.body via Zod schema first
 *
 * @module @dailyuse/utils/result/express-adapter
 *
 * @example
 * ```ts
 * import { expressAdapter, expressAdapterWithValidation } from '@dailyuse/utils/result';
 *
 * // Controller handles validation internally
 * router.post('/', auth, expressAdapter(
 *   (req, ctx) => controller.create(req.body, ctx),
 *   { successStatus: 201 },
 * ));
 *
 * // Adapter validates body first, then passes parsed data to controller
 * router.post('/', auth, expressAdapterWithValidation(schema,
 *   (data, ctx, req) => controller.create(data, ctx),
 *   { successStatus: 201 },
 * ));
 * ```
 */

import {
  extractStructuredResultError,
  type Result,
  isOk,
  errorCodeToHttpStatus,
  createHttpResponseBuilder,
} from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { mapPrismaError } from '../errors/prisma-error-mapper';
// Residual 945: formatZodErrors dual retired — sole body in format-zod-errors.
import { formatZodErrors } from './format-zod-errors';
export { formatZodErrors };

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
  /** Used for 204 No Content success responses (no JSON body). */
  end?(): this;
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
 * Residual 1183 keep-boundary: Express defaultExtractContext — HTTP request-rich Context.
 * Reads headers/body for deviceId, IP, UA, platform; identityId from req.user.
 * Soft residual 1183: IPC defaultExtractContext is desktop stub (identity '', deviceId 'desktop').
 *
 * Default context extractor from Express request
 */
function defaultExtractContext(req: ExpressLikeRequest): Context {
  const headers = req.headers ?? {};
  const userAgentHeader = headers['user-agent'];
  const userAgent = Array.isArray(userAgentHeader)
    ? userAgentHeader[0]
    : typeof userAgentHeader === 'string'
      ? userAgentHeader
      : undefined;
  const forwarded = headers['x-forwarded-for'];
  const realIp = headers['x-real-ip'];
  const ipFromForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : undefined;
  const ipAddress =
    ipFromForwarded ||
    (Array.isArray(realIp) ? realIp[0] : typeof realIp === 'string' ? realIp : undefined) ||
    null;

  const body = (req.body ?? {}) as {
    deviceId?: string;
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string | null;
      platform?: string | null;
      os?: string | null;
      browser?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      deviceType?: string;
      deviceFingerprint?: string;
    };
    ipAddress?: string;
  };

  const deviceInfo = body.deviceInfo;
  const deviceId =
    (typeof headers['x-device-id'] === 'string' && headers['x-device-id']) ||
    body.deviceId ||
    deviceInfo?.deviceId ||
    'unknown';

  const ua = deviceInfo?.userAgent || userAgent || null;
  const platform = deviceInfo?.platform || deviceInfo?.os || null;
  const browser = deviceInfo?.browser || null;
  const deviceType = deviceInfo?.deviceType || inferDeviceType(ua);
  const deviceName =
    deviceInfo?.deviceName ||
    (platform || browser ? `${platform ?? 'Unknown'} - ${browser ?? 'Unknown'}` : null);

  return {
    identityId: req.user?.identityId ?? '',
    deviceId,
    device: {
      deviceName,
      os: platform,
      browser,
      ipAddress: deviceInfo?.ipAddress || body.ipAddress || ipAddress,
      userAgent: ua,
      deviceType,
      deviceFingerprint: deviceInfo?.deviceFingerprint || undefined,
    },
  };
}

function inferDeviceType(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Browser';
  const ua = userAgent.toLowerCase();
  if (ua.includes('electron')) return 'Desktop';
  if (ua.includes('ipad') || ua.includes('tablet')) return 'Tablet';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
  return 'Browser';
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
        // HTTP 204 must not carry a JSON body (residual 108 void dual-track).
        if (successStatus === 204) {
          res.status(204);
          if (typeof res.end === 'function') {
            res.end();
          }
          return;
        }
        res.status(successStatus).json(responseBuilder.success(result.data as T));
      } else {
        const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
        res.status(status).json(responseBuilder.fromResult(result));
      }
    } catch (err) {
      const structuredError = extractStructuredResultError(err);
      if (structuredError) {
        const status = structuredError.statusCode ?? errorCodeToHttpStatus(structuredError.code);
        res
          .status(status)
          .json(
            responseBuilder.error(
              structuredError.code,
              structuredError.message,
              structuredError.details,
              structuredError.context,
            ),
          );
        return;
      }

      // 2. Prisma errors — map to safe generic messages
      const prismaMapping = err instanceof Error ? mapPrismaError(err) : null;
      if (prismaMapping) {
        res
          .status(prismaMapping.httpStatus)
          .json(responseBuilder.error(prismaMapping.resultCode, prismaMapping.message));
        return;
      }

      // 3. Everything else — never leak internal details
      // Log the full error server-side for debugging (never sent to client)
      console.error(
        '[expressAdapter] Unhandled error:',
        err instanceof Error ? (err.stack ?? err.message) : err,
      );
      res.status(500).json(responseBuilder.internalError('Internal server error'));
    }
  };
}

// ============================================================================
// Express Adapter with Validation
// ============================================================================

/**
 * Zod-like schema interface (avoid hard Zod dependency)
 */
interface ZodLikeSchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } };
}

/**
 * Adapt a controller function to an Express route handler with upfront Zod validation.
 *
 * The adapter validates `req.body` against the schema first, then calls the controller
 * with (parsedData, context, req). If validation fails, it responds with 400.
 *
 * @example
 * ```ts
 * router.post('/', auth, expressAdapterWithValidation(CreateGoalSchema,
 *   (data, ctx, req) => controller.create(data, ctx),
 *   { successStatus: 201 },
 * ));
 * ```
 */
export function expressAdapterWithValidation<TInput, TOutput>(
  schema: ZodLikeSchema<TInput>,
  controllerFn: (
    data: TInput,
    context: Context,
    req: ExpressLikeRequest,
  ) => Promise<Result<TOutput>>,
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

      // Validate request body
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const details = formatZodErrors(parsed.error.issues);
        res.status(400).json(responseBuilder.validationError(details));
        return;
      }

      const context = extractContext(req);
      const result = await controllerFn(parsed.data, context, req);

      if (isOk(result)) {
        // HTTP 204 must not carry a JSON body (residual 108 void dual-track).
        if (successStatus === 204) {
          res.status(204);
          if (typeof res.end === 'function') {
            res.end();
          }
          return;
        }
        res.status(successStatus).json(responseBuilder.success(result.data as TOutput));
      } else {
        const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
        res.status(status).json(responseBuilder.fromResult(result));
      }
    } catch (err) {
      const structuredError = extractStructuredResultError(err);
      if (structuredError) {
        const status = structuredError.statusCode ?? errorCodeToHttpStatus(structuredError.code);
        res
          .status(status)
          .json(
            responseBuilder.error(
              structuredError.code,
              structuredError.message,
              structuredError.details,
              structuredError.context,
            ),
          );
        return;
      }

      // 2. Prisma errors — map to safe generic messages
      const prismaMapping = err instanceof Error ? mapPrismaError(err) : null;
      if (prismaMapping) {
        res
          .status(prismaMapping.httpStatus)
          .json(responseBuilder.error(prismaMapping.resultCode, prismaMapping.message));
        return;
      }

      // 3. Everything else — never leak internal details
      // Log the full error server-side for debugging (never sent to client)
      console.error(
        '[expressAdapterWithValidation] Unhandled error:',
        err instanceof Error ? (err.stack ?? err.message) : err,
      );
      res.status(500).json(responseBuilder.internalError('Internal server error'));
    }
  };
}
