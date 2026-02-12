/**
 * Task Instance Routes
 * 
 * Route registration for task instance operations.
 * Follows ADR-021/022 split-route pattern.
 */

import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { TaskInstanceController } from '../controllers/task-instance.controller';
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

export function registerTaskInstanceRoutes(
  controller: TaskInstanceController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET / — List instances
  router.get(
    '/',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user?.accountUuid) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const filters = {
        templateUuid: req.query.templateUuid as string,
        status: req.query.status as any,
      };

      const result = await controller.listInstances(req.user.accountUuid, filters);
      respondWithResult(res, result);
    },
  );

  // GET /by-date-range — Get instances by date range
  router.get(
    '/by-date-range',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user?.accountUuid) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const startDate = req.query.startDate ? Number(req.query.startDate) : Date.now();
      const endDate = req.query.endDate ? Number(req.query.endDate) : Date.now() + 86400000 * 7;

      const result = await controller.getInstancesByDateRange(
        req.user.accountUuid,
        startDate,
        endDate
      );
      respondWithResult(res, result);
    },
  );

  // GET /:id — Get instance by ID
  router.get(
    '/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.getInstance(req.params.id);
      respondWithResult(res, result);
    },
  );

  // POST /:id/complete — Complete instance
  router.post(
    '/:id/complete',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const params = {
        duration: req.body.duration,
        note: req.body.note,
        rating: req.body.rating,
      };

      const result = await controller.completeInstance(req.params.id, params);
      respondWithResult(res, result);
    },
  );

  // POST /:id/skip — Skip instance
  router.post(
    '/:id/skip',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.skipInstance(req.params.id, req.body.reason);
      respondWithResult(res, result);
    },
  );

  // POST /:id/start — Start instance
  router.post(
    '/:id/start',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.startInstance(req.params.id);
      respondWithResult(res, result);
    },
  );

  // DELETE /:id — Delete instance
  router.delete(
    '/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.deleteInstance(req.params.id);
      respondWithResult(res, result);
    },
  );

  return router;
}
