/**
 * Notification API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /                — Create notification (CreateNotificationSchema)
 *   GET    /                — List/query notifications (NotificationQuerySchema)
 *   GET    /preferences     — Get notification preferences (identity-scoped)
 *   PUT    /preferences     — Update notification preferences (identity-scoped)
 *   GET    /:id             — Get notification by ID
 *   PUT    /:id             — Update notification (UpdateNotificationSchema)
 *   DELETE /:id             — Delete notification
 *   POST   /:id/read        — Mark single notification as read
 *   POST   /batch-read      — Batch mark as read (shared id-batch schema)
 *   POST   /batch-delete    — Batch delete (shared id-batch schema)
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
// Residual 989: sole parseString/parseNumber (local dual retired).
import { parseNumber, parseString } from '@dailyuse/utils/shared';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { NotificationId } from '@dailyuse/contracts/primitives';
import {
  CreateNotificationSchema,
  NotificationQuerySchema,
  NotificationIdsBatchSchema,
  CleanupOldNotificationsSchema,
  UpdateNotificationPreferenceSchema,
  NotificationResponseSchema,
  NotificationBatchResultSchema,
  UnreadCountResponseSchema,
  NotificationPreferenceResponseSchema,
} from '@dailyuse/contracts/notification';
import type { NotificationApplicationPort } from '../server/application';
import { NotificationController } from '../server/transport/notification.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseBoolean(value: unknown): boolean | undefined {
  const raw = parseString(value);
  if (raw === undefined) return undefined;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return undefined;
}

// ============ Route Registration ============

export function registerNotificationRoutes(
  api: NotificationApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new NotificationController(api);

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
    (req, ctx) => controller.create(req.body, ctx),
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
    (req, ctx) =>
      controller.list(
        {
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
        },
        ctx,
      ),
  );

  // POST /batch-read — Batch mark as read (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/batch-read',
      summary: '批量标记为已读',
      request: { body: { content: { 'application/json': { schema: NotificationIdsBatchSchema } } } },
      responses: {
        200: successResponse(NotificationBatchResultSchema, '操作成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.batchMarkAsRead(req.body, ctx),
  );

  // POST /batch-delete — Batch delete (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/batch-delete',
      summary: '批量删除通知',
      request: {
        body: { content: { 'application/json': { schema: NotificationIdsBatchSchema } } },
      },
      responses: {
        200: successResponse(NotificationBatchResultSchema, '删除成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.batchDelete(req.body, ctx),
  );

  // POST /cleanup — Cleanup old notifications (must be before /:id)
  r.route(
    {
      method: 'post',
      path: '/cleanup',
      summary: '清理过期通知',
      request: {
        body: { content: { 'application/json': { schema: CleanupOldNotificationsSchema } } },
      },
      responses: {
        200: successResponse(NotificationBatchResultSchema, '清理成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.cleanup(req.body, ctx),
  );

  // GET /unread-count — Get unread notification count (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/unread-count',
      summary: '获取未读通知数量',
      responses: {
        200: successResponse(UnreadCountResponseSchema, '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getUnreadCount(ctx.identityId),
  );

  // PATCH /read-all — Mark all notifications as read (must be before /:id)
  r.route(
    {
      method: 'patch',
      path: '/read-all',
      summary: '标记所有通知为已读',
      responses: {
        200: successResponse(UnreadCountResponseSchema, '操作成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.markAllAsRead(ctx.identityId),
  );


  // GET /preferences — must register before /:id (residual 196)
  r.route(
    {
      method: 'get',
      path: '/preferences',
      summary: '获取通知偏好',
      responses: {
        200: successResponse(NotificationPreferenceResponseSchema, '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getPreferences(ctx),
  );

  // PUT /preferences
  r.route(
    {
      method: 'put',
      path: '/preferences',
      summary: '更新通知偏好',
      request: {
        body: { content: { 'application/json': { schema: UpdateNotificationPreferenceSchema } } },
      },
      responses: {
        200: successResponse(NotificationPreferenceResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updatePreferences(req.body, ctx),
  );

  // GET /:id — Get notification by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取通知详情',
      request: { params: z.object({ id: brandedId<NotificationId>() }) },
      responses: {
        200: successResponse(NotificationResponseSchema, '获取成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.get(req.params!.id, ctx),
  );

  // DELETE /:id — Delete notification
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除通知',
      request: { params: z.object({ id: brandedId<NotificationId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.delete(req.params!.id, ctx),
  );

  // PATCH /:id/read — Mark single notification as read
  r.route(
    {
      method: 'patch',
      path: '/:id/read',
      summary: '标记通知为已读',
      request: { params: z.object({ id: brandedId<NotificationId>() }) },
      responses: {
        200: successResponse(NotificationResponseSchema, '操作成功'),
        404: errorResponse('通知不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.markAsRead(req.params!.id, ctx),
  );

  return router;
}
