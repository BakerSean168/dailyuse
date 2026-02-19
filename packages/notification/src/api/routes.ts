/**
 * Notification API Routes
 *
 * Route definitions and request handling.
 * Middleware injected via parameters (from ApiBootstrapper context),
 * no direct dependency on apps/api internals.
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
import type { Request, Response, RequestHandler } from 'express';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
  CleanupOldNotificationsSchema,
} from '@dailyuse/contracts/notification';
import { createExpressHelper } from '@dailyuse/utils/result';

// ============ Types ============

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
}

export interface NotificationRouteHandlers {
  createNotification(data: any): Promise<any>;
  listNotifications(query: any): Promise<any>;
  getNotification(id: string): Promise<any>;
  updateNotification(id: string, data: any): Promise<any>;
  deleteNotification(id: string): Promise<any>;
  markAsRead(id: string): Promise<any>;
  batchMarkAsRead(data: any): Promise<any>;
  batchDelete(data: any): Promise<any>;
  cleanupOldNotifications(data: any): Promise<any>;
}

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
  handlers: NotificationRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // POST / — Create notification
  router.post('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = CreateNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.createNotification(parsed.data);
      return helper.created(result, 'Notification created');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // GET / — List/query notifications
  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = NotificationQuerySchema.safeParse({
        identityId: parseString(req.query.identityId),
        type: parseString(req.query.type),
        category: parseString(req.query.category),
        status: parseString(req.query.status),
        isRead: parseBoolean(req.query.isRead),
        relatedEntityType: parseString(req.query.relatedEntityType),
        relatedEntityId: parseString(req.query.relatedEntityId),
        startDate: parseNumber(req.query.startDate),
        endDate: parseNumber(req.query.endDate),
        keyword: parseString(req.query.keyword),
        page: parseNumber(req.query.page),
        limit: parseNumber(req.query.limit),
        sortBy: parseString(req.query.sortBy),
        sortOrder: parseString(req.query.sortOrder),
      });

      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.listNotifications(parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // GET /:id — Get notification by ID
  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const result = await handlers.getNotification(req.params.id);
      if (!result) {
        return helper.badRequest('Notification not found');
      }
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // PUT /:id — Update notification
  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = UpdateNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.updateNotification(req.params.id, parsed.data);
      return helper.success(result, 'Notification updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return helper.badRequest(message);
    }
  });

  // DELETE /:id — Delete notification
  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      await handlers.deleteNotification(req.params.id);
      return helper.success(null, 'Notification deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      return helper.badRequest(message);
    }
  });

  // POST /:id/read — Mark single notification as read
  router.post('/:id/read', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      await handlers.markAsRead(req.params.id);
      return helper.success(null, 'Notification marked as read');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // POST /batch/read — Batch mark as read
  router.post('/batch/read', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = MarkAsReadBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.batchMarkAsRead(parsed.data);
      return helper.success(result, 'Notifications marked as read');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // POST /batch/delete — Batch delete
  router.post('/batch/delete', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = DeleteNotificationsBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.batchDelete(parsed.data);
      return helper.success(result, 'Notifications deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // POST /cleanup — Cleanup old notifications
  router.post('/cleanup', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const parsed = CleanupOldNotificationsSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.cleanupOldNotifications(parsed.data);
      return helper.success(result, 'Old notifications cleaned up');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cleanup failed';
      return helper.internalError(message);
    }
  });

  return router;
}
