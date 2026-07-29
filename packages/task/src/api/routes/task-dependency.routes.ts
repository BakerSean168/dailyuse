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
} from '@memoflow/utils/result';
import { brandedId } from '@memoflow/contracts/primitives';
import type { TaskTemplateId, TaskDependencyId } from '@memoflow/contracts/primitives';
import {
  TaskDependencyResponseSchema,
  DependencyChainResponseSchema,
  ValidateDependencyResponseSchema,
} from '@memoflow/contracts/task';
import {
  CreateDependencyBodySchema,
  UpdateDependencyBodySchema,
  ValidateDependencyBodySchema,
} from '@memoflow/contracts/task';
import type { TaskDependencyController } from '../../server/transport/task-dependency.controller';

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
    (req, ctx) => controller.getDependencies(req.params!.taskId, ctx.identityId),
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
    (req, ctx) => controller.getDependents(req.params!.taskId, ctx.identityId),
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
    (req, ctx) => controller.getDependencyChain(req.params!.taskId, ctx.identityId),
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
    (req, ctx) => controller.validateDependency(req.body, ctx.identityId),
  );

  // DELETE /dependencies/:id — Delete dependency
  r.route(
    {
      method: 'delete',
      path: '/dependencies/:id',
      summary: '删除任务依赖关系',
      request: { params: z.object({ id: brandedId<TaskDependencyId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('依赖关系不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.deleteDependency(req.params!.id, ctx.identityId),
  );

  // PUT /dependencies/:id — Update dependency
  r.route(
    {
      method: 'put',
      path: '/dependencies/:id',
      summary: '更新任务依赖关系',
      request: {
        params: z.object({ id: brandedId<TaskDependencyId>() }),
        body: { content: { 'application/json': { schema: UpdateDependencyBodySchema } } },
      },
      responses: {
        200: successResponse(TaskDependencyResponseSchema, '更新成功'),
        404: errorResponse('依赖关系不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.updateDependency(req.params!.id, req.body, ctx.identityId),
  );

  return router;
}
