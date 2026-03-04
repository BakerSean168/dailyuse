/**
 * Error Handling Middleware
 *
 * 全局错误处理器，必须在所有路由注册之后挂载。
 */

import type { Express, Request, Response, NextFunction } from 'express';
import { createLogger, isDomainError, mapPrismaError } from '@dailyuse/utils';
import { errorCodeToHttpStatus } from '@dailyuse/contracts/result';

const logger = createLogger('ErrorHandler');

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
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Express error handler caught error', err, {
      code: err?.code,
      message: err?.message,
    });

    // 1. Domain errors — safe to expose code + message
    if (isDomainError(err)) {
      const status = errorCodeToHttpStatus(err.code);
      res.status(status).json({
        ok: false,
        code: err.code,
        message: err.message,
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
