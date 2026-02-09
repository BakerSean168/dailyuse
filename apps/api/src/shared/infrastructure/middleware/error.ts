/**
 * Error Handling Middleware
 *
 * 全局错误处理器，必须在所有路由注册之后挂载。
 */

import type { Express, Request, Response, NextFunction } from 'express';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ErrorHandler');

/**
 * 应用全局错误处理中间件
 *
 * 包含：404 兜底路由 + 统一错误处理器
 */
export function applyErrorHandlers(app: Express): void {
  // 404 Not Found
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Not Found' });
  });

  // Global error handler (must have 4 args for Express to recognize it)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Express error handler caught error', err, {
      status: err?.status,
      code: err?.code,
      message: err?.message,
    });

    const status = Number(err?.status ?? 500);
    res.status(status).json({
      code: err?.code ?? 'INTERNAL_ERROR',
      message: err?.message ?? 'Internal Server Error',
    });
  });
}
