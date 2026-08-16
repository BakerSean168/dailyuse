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
} from '@memoflow/utils/result';
import {
  CheckExpiredTaskInstancesInvocationSchema,
  CheckExpiredTaskInstancesResponseSchema,
  TaskInstanceResponseSchema,
  GetTaskInstancesByRangeSchema,
  CompleteTaskInstanceInvocationSchema,
  SkipTaskInstanceInvocationSchema,
  TaskInstanceIdCommandInvocationSchema,
} from '@memoflow/contracts/task';
import { brandedId } from '@memoflow/contracts/primitives';
import type { TaskInstanceId, TaskTemplateId } from '@memoflow/contracts/primitives';
import type { TaskInstanceStatus } from '@memoflow/contracts/task';
import type { TaskInstanceController } from '../../server/transport/task-instance.controller';
// Residual 983: sole getFirstQueryValue (local dual retired).
import { getFirstQueryValue } from './get-first-query-value';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

function parseTimestampQuery(value: unknown, fallback: number): number {
  const firstValue = getFirstQueryValue(value);
  if (!firstValue) {
    return fallback;
  }

  const parsed = Number(firstValue);
  return Number.isFinite(parsed) ? parsed : fallback;
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
        query: GetTaskInstancesByRangeSchema,
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getInstancesByDateRange(ctx.identityId, {
        startDate: parseTimestampQuery(req.query?.startDate, Date.now()),
        endDate: parseTimestampQuery(req.query?.endDate, Date.now() + 86400000 * 7),
      }),
  );

  // POST /check-expired — Check and mark expired instances
  r.routeWithValidation(
    {
      method: 'post',
      path: '/check-expired',
      summary: '检查并标记过期任务实例',
      responses: {
        200: successResponse(CheckExpiredTaskInstancesResponseSchema, '检查完成'),
      },
      validation: {
        schema: CheckExpiredTaskInstancesInvocationSchema,
      },
    },
    [auth],
    (_data, ctx) => controller.checkExpired(ctx.identityId),
  );

  // GET / — List instances
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取任务实例列表',
      request: {
        query: z.object({
          templateId: brandedId<TaskTemplateId>().optional(),
          status: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listInstances(ctx.identityId, {
        templateId: getFirstQueryValue(req.query?.templateId),
        status: getFirstQueryValue(req.query?.status) as TaskInstanceStatus | undefined,
      }),
  );

  // GET /:id — Get instance by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取任务实例详情',
      request: { params: z.object({ id: brandedId<TaskInstanceId>() }) },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '获取成功'),
        404: errorResponse('实例不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getInstance(req.params!.id, ctx),
  );

  // POST /:id/complete — Complete instance
  r.routeWithValidation(
    {
      method: 'post',
      path: '/:id/complete',
      summary: '完成任务实例',
      request: {
        params: CompleteTaskInstanceInvocationSchema.shape.params,
        body: {
          content: {
            'application/json': { schema: CompleteTaskInstanceInvocationSchema.shape.body },
          },
        },
      },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '完成成功'),
        404: errorResponse('实例不存在'),
      },
      validation: {
        schema: CompleteTaskInstanceInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.completeInstance(data.params.id, data.body, ctx),
  );

  // POST /:id/skip — Skip instance
  r.routeWithValidation(
    {
      method: 'post',
      path: '/:id/uncomplete',
      summary: '撤销完成任务实例',
      request: { params: TaskInstanceIdCommandInvocationSchema.shape.params },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '撤销完成成功'),
        404: errorResponse('实例不存在'),
      },
      validation: {
        schema: TaskInstanceIdCommandInvocationSchema,
        projectInput: (req) => ({ params: req.params }),
      },
    },
    [auth],
    (data, ctx) => controller.uncompleteInstance(data.params.id, ctx),
  );

  // POST /:id/skip — Skip instance
  r.routeWithValidation(
    {
      method: 'post',
      path: '/:id/skip',
      summary: '跳过任务实例',
      request: {
        params: SkipTaskInstanceInvocationSchema.shape.params,
        body: {
          content: { 'application/json': { schema: SkipTaskInstanceInvocationSchema.shape.body } },
        },
      },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '跳过成功'),
        404: errorResponse('实例不存在'),
      },
      validation: {
        schema: SkipTaskInstanceInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.skipInstance(data.params.id, data.body, ctx),
  );

  // POST /:id/start — Start instance
  r.routeWithValidation(
    {
      method: 'post',
      path: '/:id/start',
      summary: '开始任务实例',
      request: { params: TaskInstanceIdCommandInvocationSchema.shape.params },
      responses: {
        200: successResponse(TaskInstanceResponseSchema, '开始成功'),
        404: errorResponse('实例不存在'),
      },
      validation: {
        schema: TaskInstanceIdCommandInvocationSchema,
        projectInput: (req) => ({ params: req.params }),
      },
    },
    [auth],
    (data, ctx) => controller.startInstance(data.params.id, ctx),
  );

  // DELETE /:id — Delete instance
  r.routeWithValidation(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除任务实例',
      request: { params: TaskInstanceIdCommandInvocationSchema.shape.params },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('实例不存在'),
      },
      validation: {
        schema: TaskInstanceIdCommandInvocationSchema,
        projectInput: (req) => ({ params: req.params }),
      },
    },
    [auth],
    (data, ctx) => controller.deleteInstance(data.params.id, ctx),
  );

  return router;
}
