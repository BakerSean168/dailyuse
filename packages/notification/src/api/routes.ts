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
} from '@memoflow/utils/result';
// Residual 989: sole parseString/parseNumber (local dual retired).
// Residual 1021: sole parseBoolean (local dual retired).
import { parseBoolean, parseNumber, parseString } from '@memoflow/utils/shared';
import { brandedId } from '@memoflow/contracts/primitives';
import type { NotificationId } from '@memoflow/contracts/primitives';
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
} from '@memoflow/contracts/notification';
import { BusinessOperationReceiptSchema } from '@memoflow/contracts/reliable-messaging';
import type { NotificationApplicationPort } from '../server/application';
import { NotificationController } from '../server/transport/notification.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// Residual 1021: parseBoolean elevated to @memoflow/utils/shared.

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

  // GET /dead-letters — Identity-scoped dead-letter query
  r.route(
    {
      method: 'get',
      path: '/dead-letters',
      summary: '查询死信通知队列',
      responses: {
        200: successResponse(z.array(BusinessOperationReceiptSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.queryDeadLetters(ctx),
  );

  // POST /dead-letters/:id/replay — Identity-scoped dead-letter replay
  r.route(
    {
      method: 'post',
      path: '/dead-letters/:id/replay',
      summary: '重发死信通知',
      request: { params: z.object({ id: z.string().min(1) }) },
      responses: {
        200: successResponse(BusinessOperationReceiptSchema, '重发成功'),
        404: errorResponse('死信通知不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.replayDeadLetter(req.params!.id, ctx),
  );

  // GET /receipts — Delivery receipt timeline query
  r.route(
    {
      method: 'get',
      path: '/receipts',
      summary: '查询通知投递回执时间线',
      responses: {
        200: successResponse(z.array(BusinessOperationReceiptSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getDeliveryReceipts(ctx, {
        limit: parseNumber(req.query?.limit),
        lastCursor: parseString(req.query?.lastCursor ?? req.query?.since),
        since: parseString(req.query?.since),
        status: parseString(req.query?.status),
      }),
  );

  // GET /sse — Real-time SSE Stream with Last-Event-ID / lastCursor reconnection catch-up
  router.get('/sse', auth, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const resWithFlush = res as unknown as { flushHeaders?: () => void };
    if (typeof resWithFlush.flushHeaders === 'function') {
      resWithFlush.flushHeaders();
    }

    const reqRecord = req as unknown as Record<string, unknown>;
    const userObj = reqRecord.user as { id?: string } | undefined;
    const identityId = userObj?.id ?? (reqRecord.identityId as string | undefined) ?? (req.query?.identityId as string);
    const lastEventId = (req.headers['last-event-id'] as string) || (req.query?.lastCursor as string) || (req.query?.since as string);

    const seenOperationIds = new Set<string>();
    const bufferedLiveEvents: import('../server/application').NotificationSseDeliveryEvent[] = [];
    let isHistoricalQueryFinished = false;

    // Subscribe via the SSE application port (typed event seam) BEFORE query to eliminate window loss.
    const unsubscribe = api.subscribeSseEvents((event) => {
      if (identityId && event.identityId !== identityId) return;

      const opId = (event as unknown as { operationId?: string; id?: string }).operationId ?? (event as unknown as { id?: string }).id;
      if (opId && seenOperationIds.has(opId)) {
        return; // Skip duplicate event already covered in query
      }

      if (!isHistoricalQueryFinished) {
        bufferedLiveEvents.push(event);
      } else {
        if (opId) seenOperationIds.add(opId);
        const cursor = event.updatedAt && opId ? `${event.updatedAt}|${opId}` : new Date().toISOString();
        res.write(`id: ${cursor}\nevent: notification\ndata: ${JSON.stringify(event)}\n\n`);
      }
    });

    req.on('close', () => {
      unsubscribe();
    });

    // Query historical receipts with composite cursor pagination loop (>100 backlog support)
    if (lastEventId && identityId) {
      let currentCursor: string | undefined = lastEventId;
      let hasMore = true;

      while (hasMore) {
        try {
          const receiptsResult = await api.getDeliveryReceipts(identityId, {
            lastCursor: currentCursor,
            status: 'succeeded',
            limit: 100,
          });

          if (receiptsResult.ok) {
            const receipts = (receiptsResult.data ?? []) as Array<Record<string, unknown>>;
            const previousCursor: string | undefined = currentCursor;
            for (const receipt of receipts) {
              if (receipt.operationId) {
                seenOperationIds.add(String(receipt.operationId));
              }
              const cursor = `${receipt.updatedAt}|${receipt.operationId}`;
              res.write(`id: ${cursor}\nevent: notification\ndata: ${JSON.stringify(receipt)}\n\n`);
              currentCursor = cursor;
            }

            if (receipts.length < 100 || currentCursor === previousCursor) {
              hasMore = false;
            }
          } else {
            hasMore = false;
            res.write(`event: error\ndata: ${JSON.stringify({ message: receiptsResult.error.message })}\n\n`);
            res.end();
            return;
          }
        } catch (loopErr) {
          hasMore = false;
          res.write(
            `event: error\ndata: ${JSON.stringify({ message: loopErr instanceof Error ? loopErr.message : String(loopErr) })}\n\n`,
          );
          res.end();
          return;
        }
      }
    }

    // Flush buffered live events that were not returned in historical query
    isHistoricalQueryFinished = true;
    for (const event of bufferedLiveEvents) {
      const opId = event.operationId ?? event.id;
      if (!opId || !seenOperationIds.has(opId)) {
        if (opId) seenOperationIds.add(opId);
        const cursor = event.updatedAt && opId ? `${event.updatedAt}|${opId}` : new Date().toISOString();
        res.write(`id: ${cursor}\nevent: notification\ndata: ${JSON.stringify(event)}\n\n`);
      }
    }
  });

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
