/**
 * Error Handling Middleware
 *
 * 全局错误处理器，必须在所有路由注册之后挂载。
 */

import type { Express, Request, Response, NextFunction } from 'express';
import { mapPrismaError } from '@dailyuse/utils/errors';
import { createLogger } from '@dailyuse/utils/logger';
import { errorCodeToHttpStatus, extractStructuredResultError } from '@dailyuse/contracts/result';

const logger = createLogger('ErrorHandler');

type ErrorLike = {
  code?: unknown;
  message?: unknown;
};

function isCorsRejectionError(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string' &&
    err.message === 'Not allowed by CORS'
  );
}

function toErrorLike(err: unknown): ErrorLike | null {
  return typeof err === 'object' && err !== null ? (err as ErrorLike) : null;
}

/**
 * 应用全局错误处理中间件
 *
 * 包含：404 兜底路由 + 统一错误处理器
 */
export function applyErrorHandlers(app: Express): void {
  // 404 Not Found
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Not Found' });
  });

  // Global error handler (must have 4 args for Express to recognize it)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const errorLike = toErrorLike(err);
    logger.error('Express error handler caught error', err, {
      code: errorLike?.code,
      message: errorLike?.message,
    });

    // 0. CORS rejections — expected client-side access control failures
    if (isCorsRejectionError(err)) {
      res.status(403).json({
        ok: false,
        code: 'FORBIDDEN',
        message: err.message,
      });
      return;
    }

    // 1. Structured result/domain errors — safe to expose code + message
    const structuredError = extractStructuredResultError(err);
    if (structuredError) {
      const status = structuredError.statusCode ?? errorCodeToHttpStatus(structuredError.code);
      res.status(status).json({
        ok: false,
        code: structuredError.code,
        message: structuredError.message,
        ...(structuredError.details ? { details: structuredError.details } : {}),
        ...(structuredError.context ? { context: structuredError.context } : {}),
      });
      return;
    }

    // 2. Prisma errors — map to safe generic messages
    const prismaMapping = mapPrismaError(err);
    if (prismaMapping) {
      res.status(prismaMapping.httpStatus).json({
        ok: false,
        code: prismaMapping.resultCode,
        message: prismaMapping.message,
      });
      return;
    }

    // 3. Everything else — never leak internal details
    res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
}
