/**
 * Task Stats Routes
 * 
 * Route registration for task statistics and dashboard.
 * Follows ADR-021/022 split-route pattern.
 */

import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { TaskStatsController } from '../controllers/task-stats.controller';
import {
  createResponseBuilder,
  errorCodeToHttpStatus,
  isOk,
  type Result,
} from '@dailyuse/contracts/result';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

interface AuthenticatedRequest extends Request {
  user?: {
    accountUuid: string;
    sessionUuid?: string;
  };
}

// ============ Helpers ============

const responseBuilder = createResponseBuilder();

function respondWithResult<T>(res: Response, result: Result<T>, okStatus = 200) {
  if (isOk(result as any)) {
    res.status(okStatus).json(responseBuilder.success(result.data as T));
    return;
  }

  const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
  res.status(status).json(responseBuilder.fromResult(result as any));
}

// ============ Route Registration ============

export function registerTaskStatsRoutes(
  controller: TaskStatsController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET /statistics — Get statistics
  router.get(
    '/statistics',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user?.accountUuid) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const forceRecalculate = req.query.force === 'true';
      const result = await controller.getStatistics(req.user.accountUuid, forceRecalculate);
      respondWithResult(res, result);
    },
  );

  // POST /statistics/recalculate — Force recalculate
  router.post(
    '/statistics/recalculate',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user?.accountUuid) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const result = await controller.recalculateStatistics(req.user.accountUuid, true);
      respondWithResult(res, result);
    },
  );

  return router;
}
