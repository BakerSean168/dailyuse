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
import type { TaskTemplateId } from '@memoflow/contracts/primitives';
import {
  TaskDependencyResponseSchema,
  DependencyChainResponseSchema,
  ValidateDependencyResponseSchema,
  CreateTaskDependencyInvocationSchema,
  UpdateTaskDependencyInvocationSchema,
  DeleteTaskDependencyInvocationSchema,
  ValidateTaskDependencyInvocationSchema,
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
  r.routeWithValidation(
    {
      method: 'post',
      path: '/:taskId/dependencies',
      summary: '创建任务依赖关系',
      request: {
        params: CreateTaskDependencyInvocationSchema.shape.params,
        body: {
          content: {
            'application/json': { schema: CreateTaskDependencyInvocationSchema.shape.body },
          },
        },
      },
      responses: {
        201: successResponse(TaskDependencyResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
      validation: {
        schema: CreateTaskDependencyInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.createDependency(data.params.taskId, data.body, ctx.identityId),
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
  r.routeWithValidation(
    {
      method: 'post',
      path: '/dependencies/validate',
      summary: '验证依赖关系',
      request: {
        body: {
          content: { 'application/json': { schema: ValidateTaskDependencyInvocationSchema } },
        },
      },
      responses: {
        200: successResponse(ValidateDependencyResponseSchema, '验证完成'),
      },
      validation: { schema: ValidateTaskDependencyInvocationSchema },
    },
    [auth],
    (data, ctx) => controller.validateDependency(data, ctx.identityId),
  );

  // DELETE /dependencies/:id — Delete dependency
  r.routeWithValidation(
    {
      method: 'delete',
      path: '/dependencies/:id',
      summary: '删除任务依赖关系',
      request: { params: DeleteTaskDependencyInvocationSchema.shape.params },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('依赖关系不存在'),
      },
      validation: {
        schema: DeleteTaskDependencyInvocationSchema,
        projectInput: (req) => ({ params: req.params }),
      },
    },
    [auth],
    (data, ctx) => controller.deleteDependency(data.params.id, ctx.identityId),
  );

  // PUT /dependencies/:id — Update dependency
  r.routeWithValidation(
    {
      method: 'put',
      path: '/dependencies/:id',
      summary: '更新任务依赖关系',
      request: {
        params: UpdateTaskDependencyInvocationSchema.shape.params,
        body: {
          content: {
            'application/json': { schema: UpdateTaskDependencyInvocationSchema.shape.body },
          },
        },
      },
      responses: {
        200: successResponse(TaskDependencyResponseSchema, '更新成功'),
        404: errorResponse('依赖关系不存在'),
      },
      validation: {
        schema: UpdateTaskDependencyInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.updateDependency(data.params.id, data.body, ctx.identityId),
  );

  return router;
}
