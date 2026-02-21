/**
 * Task Instance Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 * Follows ADR-021/022 split-route pattern.
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CompleteTaskInstanceSchema,
  SkipTaskInstanceSchema,
  TaskInstanceResponseSchema,
} from '@dailyuse/contracts/task';
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
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/task-instances',
    defaultTags: ['Task Instance'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET /by-date-range — Get instances by date range (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/by-date-range',
      summary: '按日期范围获取任务实例',
      request: {
        query: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.getInstancesByDateRange(
      ctx.identityId,
      req.query?.startDate ? Number(req.query.startDate) : Date.now(),
      req.query?.endDate ? Number(req.query.endDate) : Date.now() + 86400000 * 7,
    ),
  );

  // GET / — List instances
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取任务实例列表',
      request: {
        query: z.object({
          templateId: z.string().optional(),
          status: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listInstances(ctx.identityId, {
      templateId: req.query?.templateId as string,
      status: req.query?.status as any,
    }),
  );

  // GET /:id — Get instance by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取任务实例详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '获取成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req) => controller.getInstance(req.params!.id),
    { requireAuth: false },
  );

  // POST /:id/complete — Complete instance
  r.route(
    {
      method: 'post',
      path: '/:id/complete',
      summary: '完成任务实例',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: CompleteTaskInstanceSchema } } },
      },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '完成成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req) => controller.completeInstance(req.params!.id, req.body),
  );

  // POST /:id/skip — Skip instance
  r.route(
    {
      method: 'post',
      path: '/:id/skip',
      summary: '跳过任务实例',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: SkipTaskInstanceSchema } } },
      },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '跳过成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req) => controller.skipInstance(req.params!.id, req.body),
  );

  // POST /:id/start — Start instance
  r.route(
    {
      method: 'post',
      path: '/:id/start',
      summary: '开始任务实例',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '开始成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req) => controller.startInstance(req.params!.id),
  );

  // DELETE /:id — Delete instance
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除任务实例',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req) => controller.deleteInstance(req.params!.id),
  );

  return router;
}
