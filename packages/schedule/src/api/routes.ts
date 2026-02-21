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
  BatchOperationResponseSchema,
} from '@dailyuse/contracts/schedule';
import { ScheduleController } from '../controllers/schedule.controller';
import type { ScheduleUseCases } from '../controllers/schedule.controller';

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
  handlers: ScheduleUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new ScheduleController(handlers);

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
      request: { body: { content: { 'application/json': { schema: BatchScheduleTaskOperationRequestSchema } } } },
      responses: {
        200: successResponse(BatchOperationResponseSchema, '操作成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) => controller.batchOperation(req.body),
  );

  // POST /tasks — Create schedule task
  r.route(
    {
      method: 'post',
      path: '/tasks',
      summary: '创建调度任务',
      request: { body: { content: { 'application/json': { schema: CreateScheduleTaskRequestSchema } } } },
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
    (req, ctx) => controller.listTasks({
      sourceModule: parseString(req.query?.sourceModule),
      sourceEntityId: parseString(req.query?.sourceEntityId),
      status: parseString(req.query?.status),
      enabled: parseBoolean(req.query?.enabled),
      search: parseString(req.query?.search),
      page: parseNumber(req.query?.page),
      limit: parseNumber(req.query?.limit),
      sortBy: parseString(req.query?.sortBy),
      sortOrder: parseString(req.query?.sortOrder),
    }, ctx),
  );

  // GET /tasks/:id — Get task by ID
  r.route(
    {
      method: 'get',
      path: '/tasks/:id',
      summary: '获取调度任务详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '获取成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.getTask(req.params!.id),
  );

  // PUT /tasks/:id — Update task
  r.route(
    {
      method: 'put',
      path: '/tasks/:id',
      summary: '更新调度任务',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateScheduleTaskRequestSchema } } },
      },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '更新成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.updateTask(req.params!.id, req.body),
  );

  // DELETE /tasks/:id — Delete task
  r.route(
    {
      method: 'delete',
      path: '/tasks/:id',
      summary: '删除调度任务',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.deleteTask(req.params!.id),
  );

  // POST /tasks/:id/pause — Pause task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/pause',
      summary: '暂停调度任务',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '暂停成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.pauseTask(req.params!.id),
  );

  // POST /tasks/:id/resume — Resume task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/resume',
      summary: '恢复调度任务',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '恢复成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.resumeTask(req.params!.id),
  );

  // POST /tasks/:id/trigger — Trigger task
  r.route(
    {
      method: 'post',
      path: '/tasks/:id/trigger',
      summary: '手动触发调度任务',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(ScheduleTaskResponseSchema, '触发成功'),
        404: errorResponse('任务不存在'),
      },
    },
    [auth],
    (req) => controller.triggerTask(req.params!.id),
  );

  return router;
}
