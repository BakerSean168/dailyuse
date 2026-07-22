/**
 * Schedule API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /tasks/batch     — Batch operations (must be before /tasks/:id)
 *   POST   /tasks           — Create schedule task
 *   GET    /tasks           — List tasks with query params
 *   GET    /tasks/:id       — Get task by ID
 *   PUT    /tasks/:id       — Update task
 *   DELETE /tasks/:id       — Delete task
 *   POST   /tasks/:id/pause  — Pause task
 *   POST   /tasks/:id/resume — Resume task
 *   POST   /tasks/:id/trigger — Trigger task
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
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
  ScheduleTaskResponseSchema,
  ScheduleBatchOperationResponseSchema,
  BatchDeleteResponseSchema,
  UpdateTaskMetadataRequestSchema,
} from '@dailyuse/contracts/schedule';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { ScheduleTaskId } from '@dailyuse/contracts/primitives';
import type { ScheduleApplicationPort } from '../server/application';
import { ScheduleController } from '../server/transport/schedule.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function parseString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

// ============ Route Registration ============

export function registerScheduleRoutes(
  api: ScheduleApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new ScheduleController(api);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/schedules',
    defaultTags: ['Schedule'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /tasks/batch — Batch operations (must be before /tasks/:id)
  r.route(
    {
      method: 'post',
      path: '/tasks/batch',
      summary: '批量操作调度任务',
      request: {
        body: {
          content: { 'application/json': { schema: BatchScheduleTaskOperationRequestSchema } },
        },
      },
      responses: {
        200: successResponse(ScheduleBatchOperationResponseSchema, '操作成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.batchOperation(req.body, ctx),
  );

  // POST /tasks/batch/delete — Batch delete tasks (must be before /tasks/:id)
  r.route(
    {
      method: 'post',
      path: '/tasks/batch/delete',
      summary: '批量删除调度任务',
      request: {
        body: {
          content: { 'application/json': { schema: z.object({ taskIds: z.array(brandedId<ScheduleTaskId>()).min(1) }) } },
        },
      },
      responses: {
        200: successResponse(BatchDeleteResponseSchema, '删除成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.batchDeleteTasks(req.body, ctx),
  );

  // GET /tasks/due — Get due tasks (must be before /tasks/:id)
  r.route(
    {
      method: 'get',
      path: '/tasks/due',
      summary: '获取待执行的调度任务',
      responses: {
        200: successResponse(z.array(ScheduleTaskResponseSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getDueTasks(ctx),
  );

  // POST /tasks — Create schedule task
  r.route(
    {
      method: 'post',
      path: '/tasks',
      summary: '创建调度任务',
      request: {
        body: { content: { 'application/json': { schema: CreateScheduleTaskRequestSchema } } },
      },
      responses: {
        201: successResponse(ScheduleTaskResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTask(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /tasks — List tasks with query params
  r.route(
    {
      method: 'get',
      path: '/tasks',
      summary: '获取调度任务列表',
      request: { query: ScheduleTaskQueryParamsSchema },
      responses: {
        200: successResponse(z.array(ScheduleTaskResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listTasks(
        {
          sourceModule: parseString(req.query?.sourceModule),
          sourceEntityId: parseString(req.query?.sourceEntityId),
          status: parseString(req.query?.status),
          enabled: parseBoolean(req.query?.enabled),
          search: parseString(req.query?.search),
          page: parseNumber(req.query?.page),
          limit: parseNumber(req.query?.limit),
          sortBy: parseString(req.query?.sortBy),
          sortOrder: parseString(req.query?.sortOrder),
        },
        ctx,
      ),
  );

  // GET /tasks/:id — Get task by ID
  r.route(
    {
      method: 'get',
      path: '/tasks/:id',
      summary: '获取调度任务详情',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '获取成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getTask(req.params!.id, ctx),
  );

  // PUT /tasks/:id — Update task
  r.route(
    {
      method: 'put',
      path: '/tasks/:id',
      summary: '更新调度任务',
      request: {
        params: z.object({ id: brandedId<ScheduleTaskId>() }),
        body: { content: { 'application/json': { schema: UpdateScheduleTaskRequestSchema } } },
      },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '更新成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTask(req.params!.id, req.body, ctx),
  );

  // DELETE /tasks/:id — Delete task
  r.route(
    {
      method: 'delete',
      path: '/tasks/:id',
      summary: '删除调度任务',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteTask(req.params!.id, ctx),
  );

  // POST /tasks/:id/pause — Pause task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/pause',
      summary: '暂停调度任务',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '暂停成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.pauseTask(req.params!.id, ctx),
  );

  // POST /tasks/:id/resume — Resume task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/resume',
      summary: '恢复调度任务',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '恢复成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.resumeTask(req.params!.id, ctx),
  );

  // POST /tasks/:id/trigger — Trigger task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/trigger',
      summary: '手动触发调度任务',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '触发成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.triggerTask(req.params!.id, ctx),
  );

  // POST /tasks/:id/complete — Complete task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/complete',
      summary: '完成调度任务',
      request: { params: z.object({ id: brandedId<ScheduleTaskId>() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '完成成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.completeTask(req.params!.id, ctx),
  );

  // POST /tasks/:id/cancel — Cancel task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/cancel',
      summary: '取消调度任务',
      request: {
        params: z.object({ id: brandedId<ScheduleTaskId>() }),
        body: { content: { 'application/json': { schema: z.object({ reason: z.string().optional() }) } } },
      },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '取消成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.cancelTask(req.params!.id, req.body, ctx),
  );

  // PATCH /tasks/:id/metadata — Update task metadata
  r.route(
    {
      method: 'patch',
      path: '/tasks/:id/metadata',
      summary: '更新调度任务元数据',
      request: {
        params: z.object({ id: brandedId<ScheduleTaskId>() }),
        body: { content: { 'application/json': { schema: UpdateTaskMetadataRequestSchema } } },
      },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '更新成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTaskMetadata(req.params!.id, req.body, ctx),
  );

  return router;
}
