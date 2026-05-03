/**
 * Task Dependency Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册。
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
import { brandedId } from '@dailyuse/contracts/primitives';
import type { TaskTemplateId, TaskDependencyId } from '@dailyuse/contracts/primitives';
import type { TaskDependencyController } from '../../controllers/task-dependency.controller';

// ============ Schemas ============

const TaskDependencyResponseSchema = z.object({
  id: z.string(),
  predecessorTaskId: z.string(),
  successorTaskId: z.string(),
  dependencyType: z.string(),
  lagDays: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const DependencyChainResponseSchema = z.object({
  taskId: z.string(),
  allPredecessors: z.array(z.string()),
  allSuccessors: z.array(z.string()),
  depth: z.number(),
  isOnCriticalPath: z.boolean(),
});

const ValidateDependencyResponseSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
  wouldCreateCycle: z.boolean().optional(),
  cyclePath: z.array(z.string()).optional(),
  message: z.string().optional(),
});

const CreateDependencyBodySchema = z.object({
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1).optional(),
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

const UpdateDependencyBodySchema = z.object({
  dependencyType: z.string().optional(),
  lagDays: z.number().optional(),
});

const ValidateDependencyBodySchema = z.object({
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1),
});

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerTaskDependencyRoutes(
  controller: TaskDependencyController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/tasks',
    defaultTags: ['Task Dependency'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /:taskId/dependencies — Create dependency
  r.route(
    {
      method: 'post',
      path: '/:taskId/dependencies',
      summary: '创建任务依赖关系',
      request: {
        params: z.object({ taskId: brandedId<TaskTemplateId>() }),
        body: { content: { 'application/json': { schema: CreateDependencyBodySchema } } },
      },
      responses: {
        201: successResponse(TaskDependencyResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createDependency(req.params!.taskId, req.body, ctx.identityId),
    { successStatus: 201 },
  );

  // GET /:taskId/dependencies — Get task dependencies (predecessor tasks)
  r.route(
    {
      method: 'get',
      path: '/:taskId/dependencies',
      summary: '获取任务依赖列表（前置任务）',
      request: {
        params: z.object({ taskId: brandedId<TaskTemplateId>() }),
      },
      responses: {
        200: successResponse(z.array(TaskDependencyResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req) => controller.getDependencies(req.params!.taskId),
    { requireAuth: false },
  );

  // GET /:taskId/dependents — Get task dependents (successor tasks)
  r.route(
    {
      method: 'get',
      path: '/:taskId/dependents',
      summary: '获取任务后续依赖列表',
      request: {
        params: z.object({ taskId: brandedId<TaskTemplateId>() }),
      },
      responses: {
        200: successResponse(z.array(TaskDependencyResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req) => controller.getDependents(req.params!.taskId),
    { requireAuth: false },
  );

  // GET /:taskId/dependency-chain — Get full dependency chain
  r.route(
    {
      method: 'get',
      path: '/:taskId/dependency-chain',
      summary: '获取任务完整依赖链',
      request: {
        params: z.object({ taskId: brandedId<TaskTemplateId>() }),
      },
      responses: {
        200: successResponse(DependencyChainResponseSchema, '获取成功'),
      },
    },
    [auth],
    (req) => controller.getDependencyChain(req.params!.taskId),
    { requireAuth: false },
  );

  // POST /dependencies/validate — Validate a potential dependency
  r.route(
    {
      method: 'post',
      path: '/dependencies/validate',
      summary: '验证依赖关系',
      request: {
        body: { content: { 'application/json': { schema: ValidateDependencyBodySchema } } },
      },
      responses: {
        200: successResponse(ValidateDependencyResponseSchema, '验证完成'),
      },
    },
    [auth],
    (req) => controller.validateDependency(req.body),
    { requireAuth: false },
  );

  // DELETE /dependencies/:id — Delete dependency
  r.route(
    {
      method: 'delete',
      path: '/dependencies/:id',
      summary: '删除任务依赖关系',
      request: { params: z.object({ id: z.string() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('依赖关系不存在'),
      },
    },
    [auth],
    (req) => controller.deleteDependency(req.params!.id),
  );

  // PUT /dependencies/:id — Update dependency
  r.route(
    {
      method: 'put',
      path: '/dependencies/:id',
      summary: '更新任务依赖关系',
      request: {
        params: z.object({ id: z.string() }),
        body: { content: { 'application/json': { schema: UpdateDependencyBodySchema } } },
      },
      responses: {
        200: successResponse(TaskDependencyResponseSchema, '更新成功'),
        404: errorResponse('依赖关系不存在'),
      },
    },
    [auth],
    (req) => controller.updateDependency(req.params!.id, req.body),
  );

  return router;
}
