/**
 * Task Template Routes — Unified Route + OpenAPI Registration
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
  CreateTaskTemplateSchema,
  CreateTaskTemplateResponseSchema,
  UpdateTaskTemplateSchema,
  TaskTemplateGraphResponseSchema,
  TaskTemplateResponseSchema,
  TaskTemplateListResponseSchema,
  GenerateInstancesSchema,
  TaskGoalBindingSchema,
  TaskInstanceResponseSchema,
  ListTaskTemplateFiltersSchema,
  TaskTemplateInstancesQuerySchema,
} from '@dailyuse/contracts/task';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { ListTaskTemplateFilters } from '@dailyuse/contracts/task';
import type { TaskTemplateController } from '../../server/transport/task-template.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

function getFirstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

function parseTemplateFilters(query: Record<string, unknown> | undefined): ListTaskTemplateFilters {
  const status = Array.isArray(query?.status)
    ? (query!.status as string[])
    : typeof query?.status === 'string'
      ? [query!.status as string]
      : undefined;
  const folderId = typeof query?.folderId === 'string' ? (query.folderId as ListTaskTemplateFilters['folderId']) : undefined;
  const goalId = typeof query?.goalId === 'string' ? (query.goalId as ListTaskTemplateFilters['goalId']) : undefined;
  const tags = Array.isArray(query?.tags)
    ? (query!.tags as string[])
    : typeof query?.tags === 'string'
      ? [query!.tags as string]
      : undefined;

  return { status, folderId, goalId, tags };
}

function parseTemplateInstancesRange(
  query: Record<string, unknown> | undefined,
): { from?: number; to?: number } {
  const fromValue = getFirstQueryValue(query?.from);
  const toValue = getFirstQueryValue(query?.to);
  const from = fromValue ? Number(fromValue) : undefined;
  const to = toValue ? Number(toValue) : undefined;

  return {
    from: Number.isFinite(from) ? from : undefined,
    to: Number.isFinite(to) ? to : undefined,
  };
}

// ============ Route Registration ============

export function registerTaskTemplateRoutes(
  controller: TaskTemplateController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/task-templates',
    defaultTags: ['Task Template'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create template
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建任务模板',
      request: { body: { content: { 'application/json': { schema: CreateTaskTemplateSchema } } } },
      responses: {
        201: successResponse(CreateTaskTemplateResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTemplate(req.body, ctx),
    { successStatus: 201 },
  );

  // GET / — List templates
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取任务模板列表',
      request: {
        query: ListTaskTemplateFiltersSchema,
      },
      responses: {
        200: successResponse(TaskTemplateListResponseSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listTemplates(parseTemplateFilters(req.query as Record<string, unknown>), ctx),
  );

  // GET /graph — List templates with dependency graph projection
  r.route(
    {
      method: 'get',
      path: '/graph',
      summary: '获取任务模板图数据',
      request: {
        query: ListTaskTemplateFiltersSchema,
      },
      responses: {
        200: successResponse(TaskTemplateGraphResponseSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getTaskGraph(parseTemplateFilters(req.query as Record<string, unknown>), ctx),
  );

  // GET /by-priority — List templates sorted by priority (must be before /:id)
  r.route(
    {
      method: 'get',
      path: '/by-priority',
      summary: '按优先级获取任务模板',
      request: {
        query: z.object({
          limit: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(TaskTemplateResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listByPriority(ctx, req.query?.limit ? Number(req.query.limit) : undefined),
  );

  // GET /:id — Get template by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取任务模板详情',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.getTemplate(req.params!.id, ctx, req.query?.includeChildren === 'true'),
  );

  // PUT /:id — Update template (backwards compatibility)
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新任务模板',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: UpdateTaskTemplateSchema } } },
      },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '更新成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTemplate(req.params!.id, req.body, ctx),
  );

  // PATCH /:id — Update template (preferred method for partial updates)
  r.route(
    {
      method: 'patch',
      path: '/:id',
      summary: '更新任务模板',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: UpdateTaskTemplateSchema } } },
      },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '更新成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateTemplate(req.params!.id, req.body, ctx),
  );

  // DELETE /:id — Delete template
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除任务模板',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteTemplate(req.params!.id, ctx),
  );

  // POST /:id/activate — Activate template
  r.route(
    {
      method: 'post',
      path: '/:id/activate',
      summary: '激活任务模板',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '激活成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.activateTemplate(req.params!.id, ctx),
  );

  // POST /:id/pause — Pause template
  r.route(
    {
      method: 'post',
      path: '/:id/pause',
      summary: '暂停任务模板',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '暂停成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.pauseTemplate(req.params!.id, ctx),
  );

  // POST /:id/archive — Archive template
  r.route(
    {
      method: 'post',
      path: '/:id/archive',
      summary: '归档任务模板',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '归档成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.archiveTemplate(req.params!.id, ctx),
  );

  // POST /:id/generate-instances — Generate instances for template
  r.route(
    {
      method: 'post',
      path: '/:id/generate-instances',
      summary: '为模板生成任务实例',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: GenerateInstancesSchema } } },
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '生成成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.generateInstances(req.params!.id, req.body, ctx),
  );

  // GET /:id/instances — Get instances by template ID
  r.route(
    {
      method: 'get',
      path: '/:id/instances',
      summary: '获取模板的任务实例列表',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        query: TaskTemplateInstancesQuerySchema,
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getInstancesByTemplate(
        req.params!.id,
        ctx,
        parseTemplateInstancesRange(req.query as Record<string, unknown>),
      ),
  );

  // POST /:id/bind-goal — Bind template to goal
  r.route(
    {
      method: 'post',
      path: '/:id/bind-goal',
      summary: '绑定任务模板到目标',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: TaskGoalBindingSchema } } },
      },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '绑定成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.bindToGoal(req.params!.id, req.body, ctx),
  );

  // POST /:id/unbind-goal — Unbind template from goal
  r.route(
    {
      method: 'post',
      path: '/:id/unbind-goal',
      summary: '解除任务模板与目标的绑定',
      request: { params: z.object({ id: brandedId<TaskTemplateId>() }) },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '解绑成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.unbindFromGoal(req.params!.id, ctx),
  );

  return router;
}
