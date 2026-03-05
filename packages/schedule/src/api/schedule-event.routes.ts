/**
 * Schedule Event Routes — Calendar Entry CRUD + Conflict Detection
 *
 * Routes:
 *   POST   /              — Create schedule event
 *   GET    /              — List events by time range (query: startTime, endTime)
 *   GET    /:id           — Get event by ID
 *   PUT    /:id           — Update event
 *   PATCH  /:id           — Update event (alias)
 *   DELETE /:id           — Delete event
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
  CreateScheduleRequestSchema,
  UpdateScheduleRequestSchema,
  CalendarEntryResponseSchema,
} from '@dailyuse/contracts/schedule';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { ScheduleId } from '@dailyuse/contracts/primitives';
import type { ScheduleEventController } from '../controllers/schedule-event.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerScheduleEventRoutes(
  controller: ScheduleEventController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/schedules/events',
    defaultTags: ['ScheduleEvent'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — 创建日程事件
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建日程事件',
      request: {
        body: { content: { 'application/json': { schema: CreateScheduleRequestSchema } } },
      },
      responses: {
        201: successResponse(CalendarEntryResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, ctx),
    { successStatus: 201 },
  );

  // GET / — 按时间范围查询日程
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '按时间范围查询日程事件',
      request: {
        query: z.object({
          startTime: z.string().describe('开始时间戳（毫秒）'),
          endTime: z.string().describe('结束时间戳（毫秒）'),
        }),
      },
      responses: {
        200: successResponse(z.array(CalendarEntryResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getByTimeRange(
        {
          startTime: req.query?.startTime,
          endTime: req.query?.endTime,
        },
        ctx,
      ),
  );

  // GET /:id — 获取日程详情
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取日程事件详情',
      request: { params: z.object({ id: brandedId<ScheduleId>() }) },
      responses: {
        200: successResponse(CalendarEntryResponseSchema, '获取成功'),
        404: errorResponse('日程不存在'),
      },
    },
    [auth],
    (req) => controller.get(req.params!.id),
  );

  // PUT /:id — 更新日程
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新日程事件',
      request: {
        params: z.object({ id: brandedId<ScheduleId>() }),
        body: { content: { 'application/json': { schema: UpdateScheduleRequestSchema } } },
      },
      responses: {
        200: successResponse(CalendarEntryResponseSchema, '更新成功'),
        404: errorResponse('日程不存在'),
      },
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
  );

  // PATCH /:id — 更新日程（别名）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
  );

  // DELETE /:id — 删除日程
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除日程事件',
      request: { params: z.object({ id: brandedId<ScheduleId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('日程不存在'),
      },
    },
    [auth],
    (req) => controller.delete(req.params!.id),
  );

  return router;
}
