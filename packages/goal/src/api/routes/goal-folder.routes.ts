/**
 * Goal Folder CRUD Routes
 *
 * 目标文件夹的增删改查路由。
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
  CreateGoalFolderSchema,
  GoalFolderClientDTOSchema,
  ListGoalFolderFiltersSchema,
  QueryGoalFoldersResSchema,
  UpdateGoalFolderInvocationSchema,
} from '@memoflow/contracts/goal';
import { brandedId } from '@memoflow/contracts/primitives';
import type { GoalFolderId } from '@memoflow/contracts/primitives';
import type { ListGoalFolderFilters } from '@memoflow/contracts/goal';
import type { GoalFolderController } from '../../server/transport/goal-folder.controller';
// Residual 985: sole parseBoolean (local dual retired).
import { parseBoolean } from './parse-boolean';

// ============ Helpers ============

/**
 * Normalizes raw Express req.query into a canonical ListGoalFolderFilters.
 * Pure query-alias projector — it composes wire values, not schema validation.
 * 把原始 Express req.query 规范化成 canonical ListGoalFolderFilters。
 * 纯 query alias projector——只组合 wire 值，不做 schema 校验。
 */
function normalizeFolderListQuery(
  query: Record<string, unknown> | undefined,
): ListGoalFolderFilters {
  const parentFolderId =
    typeof query?.parentFolderId === 'string' && query.parentFolderId
      ? (query.parentFolderId as GoalFolderId)
      : undefined;
  return {
    parentFolderId,
    includeSystemFolders: parseBoolean(query?.includeSystemFolders),
    sortBy: (query?.sortBy as ListGoalFolderFilters['sortBy']) ?? undefined,
    sortOrder: (query?.sortOrder as ListGoalFolderFilters['sortOrder']) ?? undefined,
  };
}

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerGoalFolderRoutes(
  controller: GoalFolderController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goal-folders',
    defaultTags: ['GoalFolder'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // ==================== Goal Folder CRUD ====================

  // POST / — 创建文件夹
  r.routeWithValidation(
    {
      method: 'post',
      path: '/',
      summary: '创建目标文件夹',
      request: { body: { content: { 'application/json': { schema: CreateGoalFolderSchema } } } },
      responses: {
        201: successResponse(GoalFolderClientDTOSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
      validation: { schema: CreateGoalFolderSchema },
    },
    [auth],
    (data, ctx) => controller.create(data, ctx),
    { successStatus: 201 },
  );

  // GET / — 查询文件夹列表
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取目标文件夹列表',
      request: {
        query: ListGoalFolderFiltersSchema,
      },
      responses: {
        200: successResponse(QueryGoalFoldersResSchema, '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      // Pass filters to controller - identityId is injected from ctx inside controller
      controller.list(normalizeFolderListQuery(req.query as Record<string, unknown>), ctx),
  );

  // GET /:id — 获取文件夹详情
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取目标文件夹详情',
      request: { params: z.object({ id: brandedId<GoalFolderId>() }) },
      responses: {
        200: successResponse(GoalFolderClientDTOSchema, '获取成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.get(req.params!.id, ctx),
  );

  // PUT /:id — 更新文件夹
  r.routeWithValidation(
    {
      method: 'put',
      path: '/:id',
      summary: '更新目标文件夹',
      request: {
        params: UpdateGoalFolderInvocationSchema.shape.params,
        body: {
          content: { 'application/json': { schema: UpdateGoalFolderInvocationSchema.shape.body } },
        },
      },
      responses: {
        200: successResponse(GoalFolderClientDTOSchema, '更新成功'),
        404: errorResponse('文件夹不存在'),
      },
      validation: {
        schema: UpdateGoalFolderInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.update(data.params.id, data.body, ctx),
  );

  // PATCH /:id — 更新文件夹（别名，跳过 OpenAPI 避免重复）
  r.routeWithValidation(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
      validation: {
        schema: UpdateGoalFolderInvocationSchema,
        projectInput: (req) => ({ params: req.params, body: req.body }),
      },
    },
    [auth],
    (data, ctx) => controller.update(data.params.id, data.body, ctx),
  );

  // DELETE /:id — 删除文件夹
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除目标文件夹',
      request: { params: z.object({ id: brandedId<GoalFolderId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.delete(req.params!.id, ctx),
  );

  return router;
}
