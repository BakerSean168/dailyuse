/**
 * Notification API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
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

import { z } from 'zod';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
  CleanupOldNotificationsSchema,
} from '@dailyuse/contracts/notification';
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

// ============ Response Schemas ============

const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  category: z.string(),
  status: z.string(),
  isRead: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const BatchResultSchema = z.object({
  successCount: z.number(),
  failedCount: z.number(),
});

// ============ Route Registration ============

export function registerNotificationRoutes(
  handlers: NotificationUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new NotificationController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/notifications',
    defaultTags: ['Notification'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create notification
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建通知',
      request: { body: { content: { 'application/json': { schema: CreateNotificationSchema } } } },
      responses: {
        201: successResponse(NotificationResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.create(req.body),
    { successStatus: 201 },
  );

  // GET / — List/query notifications
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '查询通知列表',
      request: { query: NotificationQuerySchema },
      responses: {
        200: successResponse(z.array(NotificationResponseSchema), '获取成功'),
      },
    },
    [auth],
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
  );

  // POST /batch/read — Batch mark as read (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/batch/read',
      summary: '批量标记为已读',
      request: { body: { content: { 'application/json': { schema: MarkAsReadBatchSchema } } } },
      responses: {
        200: successResponse(BatchResultSchema, '操作成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.batchMarkAsRead(req.body),
  );

  // POST /batch/delete — Batch delete (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/batch/delete',
      summary: '批量删除通知',
      request: { body: { content: { 'application/json': { schema: DeleteNotificationsBatchSchema } } } },
      responses: {
        200: successResponse(BatchResultSchema, '删除成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.batchDelete(req.body),
  );

  // POST /cleanup — Cleanup old notifications (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/cleanup',
      summary: '清理过期通知',
      request: { body: { content: { 'application/json': { schema: CleanupOldNotificationsSchema } } } },
      responses: {
        200: successResponse(BatchResultSchema, '清理成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.cleanup(req.body),
  );

  // GET /:id — Get notification by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取通知详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(NotificationResponseSchema, '获取成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req) => controller.get(req.params!.id),
  );

  // PUT /:id — Update notification
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新通知',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateNotificationSchema } } },
      },
      responses: {
        200: successResponse(NotificationResponseSchema, '更新成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
  );

  // DELETE /:id — Delete notification
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除通知',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req) => controller.delete(req.params!.id),
  );

  // POST /:id/read — Mark single notification as read
  r.route(
    {
      method: 'post',
      path: '/:id/read',
      summary: '标记通知为已读',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(NotificationResponseSchema, '操作成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req) => controller.markAsRead(req.params!.id),
  );

  return router;
}
