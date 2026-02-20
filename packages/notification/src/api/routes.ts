/**
 * Notification API Routes
 *
 * Route definitions and request handling.
 * Middleware injected via parameters (from ApiBootstrapper context),
 * no direct dependency on apps/api internals.
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the NotificationController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
 *
 * Routes:
 *   POST   /                — Create notification (CreateNotificationSchema)
 *   GET    /                — List/query notifications (NotificationQuerySchema)
 *   GET    /:id             — Get notification by ID
 *   PUT    /:id             — Update notification (UpdateNotificationSchema)
 *   DELETE /:id             — Delete notification
 *   POST   /:id/read        — Mark single notification as read
 *   POST   /batch/read      — Batch mark as read (MarkAsReadBatchSchema)
 *   POST   /batch/delete    — Batch delete (DeleteNotificationsBatchSchema)
 *   POST   /cleanup         — Cleanup old notifications (CleanupOldNotificationsSchema)
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { NotificationController } from '../controllers/notification.controller';
import type { NotificationUseCases } from '../controllers/notification.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseNumber(value: unknown): number | undefined {
  const raw = parseString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  const raw = parseString(value);
  if (raw === undefined) return undefined;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return undefined;
}

// ============ Route Registration ============

export function registerNotificationRoutes(
  handlers: NotificationUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new NotificationController(handlers);

  // POST / — Create notification
  router.post('/', auth, expressAdapter(
    (req) => controller.create(req.body),
    { successStatus: 201 },
  ));

  // GET / — List/query notifications
  router.get('/', auth, expressAdapter(
    (req) => controller.list({
      identityId: parseString(req.query?.identityId),
      type: parseString(req.query?.type),
      category: parseString(req.query?.category),
      status: parseString(req.query?.status),
      isRead: parseBoolean(req.query?.isRead),
      relatedEntityType: parseString(req.query?.relatedEntityType),
      relatedEntityId: parseString(req.query?.relatedEntityId),
      startDate: parseNumber(req.query?.startDate),
      endDate: parseNumber(req.query?.endDate),
      keyword: parseString(req.query?.keyword),
      page: parseNumber(req.query?.page),
      limit: parseNumber(req.query?.limit),
      sortBy: parseString(req.query?.sortBy),
      sortOrder: parseString(req.query?.sortOrder),
    }),
  ));

  // GET /:id — Get notification by ID
  router.get('/:id', auth, expressAdapter(
    (req) => controller.get(req.params!.id),
  ));

  // PUT /:id — Update notification
  router.put('/:id', auth, expressAdapter(
    (req) => controller.update(req.params!.id, req.body),
  ));

  // DELETE /:id — Delete notification
  router.delete('/:id', auth, expressAdapter(
    (req) => controller.delete(req.params!.id),
  ));

  // POST /:id/read — Mark single notification as read
  router.post('/:id/read', auth, expressAdapter(
    (req) => controller.markAsRead(req.params!.id),
  ));

  // POST /batch/read — Batch mark as read
  router.post('/batch/read', auth, expressAdapter(
    (req) => controller.batchMarkAsRead(req.body),
  ));

  // POST /batch/delete — Batch delete
  router.post('/batch/delete', auth, expressAdapter(
    (req) => controller.batchDelete(req.body),
  ));

  // POST /cleanup — Cleanup old notifications
  router.post('/cleanup', auth, expressAdapter(
    (req) => controller.cleanup(req.body),
  ));

  return router;
}
