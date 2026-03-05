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
  UpdateTaskTemplateSchema,
  TaskTemplateResponseSchema,
  GenerateInstancesSchema,
  BindToGoalSchema,
  TaskInstanceResponseSchema,
} from '@dailyuse/contracts/task';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { TaskTemplateController } from '../controllers/task-template.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
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
        201: successResponse(TaskTemplateResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createTemplate(req.body, ctx.identityId),
    { successStatus: 201 },
  );

  // GET / — List templates
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取任务模板列表',
      request: {
        query: z.object({
          status: z.string().optional(),
          folderId: z.string().optional(),
          goalId: z.string().optional(),
          tags: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(TaskTemplateResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listTemplates(ctx.identityId, {
      status: req.query?.status as any,
      folderId: req.query?.folderId as string,
      goalId: req.query?.goalId as string,
      tags: req.query?.tags ? (req.query.tags as string).split(',') : undefined,
    }),
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
    (req, ctx) => controller.listByPriority(
      ctx.identityId,
      req.query?.limit ? Number(req.query.limit) : undefined,
    ),
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
    (req) => controller.getTemplate(req.params!.id, req.query?.includeChildren === 'true'),
    { requireAuth: false },
  );

  // PUT /:id — Update template
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
    (req) => controller.updateTemplate(req.params!.id, req.body),
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
    (req) => controller.deleteTemplate(req.params!.id),
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
    (req) => controller.activateTemplate(req.params!.id),
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
    (req) => controller.pauseTemplate(req.params!.id),
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
    (req) => controller.archiveTemplate(req.params!.id),
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
    (req) => controller.generateInstances(req.params!.id, req.body),
  );

  // GET /:id/instances — Get instances by template ID
  r.route(
    {
      method: 'get',
      path: '/:id/instances',
      summary: '获取模板的任务实例列表',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
      },
      responses: {
        200: successResponse(z.array(TaskInstanceResponseSchema), '获取成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.getInstancesByTemplate(req.params!.id),
    { requireAuth: false },
  );

  // POST /:id/bind-goal — Bind template to goal
  r.route(
    {
      method: 'post',
      path: '/:id/bind-goal',
      summary: '绑定任务模板到目标',
      request: {
        params: z.object({ id: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: BindToGoalSchema } } },
      },
      responses: {
        200: successResponse(TaskTemplateResponseSchema, '绑定成功'),
        404: errorResponse('模板不存在'),
      },
    },
    [auth],
    (req) => controller.bindToGoal(req.params!.id, req.body),
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
    (req) => controller.unbindFromGoal(req.params!.id),
  );

  return router;
}
