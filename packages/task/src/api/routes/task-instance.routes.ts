/**
 * Task Instance Routes
 *
 * Route registration for task instance operations.
 * Follows ADR-021/022 split-route pattern.
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the TaskInstanceController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
 */

import { Router, type RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import type { TaskInstanceController } from '../controllers/task-instance.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerTaskInstanceRoutes(
  controller: TaskInstanceController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET / — List instances
  router.get('/', auth, expressAdapter(
    (req, ctx) => controller.listInstances(ctx.identityId, {
      templateId: req.query?.templateId as string,
      status: req.query?.status as any,
    }),
  ));

  // GET /by-date-range — Get instances by date range
  router.get('/by-date-range', auth, expressAdapter(
    (req, ctx) => controller.getInstancesByDateRange(
      ctx.identityId,
      req.query?.startDate ? Number(req.query.startDate) : Date.now(),
      req.query?.endDate ? Number(req.query.endDate) : Date.now() + 86400000 * 7,
    ),
  ));

  // GET /:id — Get instance by ID
  router.get('/:id', auth, expressAdapter(
    (req) => controller.getInstance(req.params!.id),
    { requireAuth: false },
  ));

  // POST /:id/complete — Complete instance
  router.post('/:id/complete', auth, expressAdapter(
    (req) => controller.completeInstance(req.params!.id, req.body),
  ));

  // POST /:id/skip — Skip instance
  router.post('/:id/skip', auth, expressAdapter(
    (req) => controller.skipInstance(req.params!.id, req.body),
  ));

  // POST /:id/start — Start instance
  router.post('/:id/start', auth, expressAdapter(
    (req) => controller.startInstance(req.params!.id),
  ));

  // DELETE /:id — Delete instance
  router.delete('/:id', auth, expressAdapter(
    (req) => controller.deleteInstance(req.params!.id),
  ));

  return router;
}
