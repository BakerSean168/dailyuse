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
} from '@dailyuse/utils/result';
import {
  CreateGoalFolderSchema,
  UpdateGoalFolderSchema,
  GoalFolderClientDTOSchema,
  ListGoalFolderFiltersSchema,
  QueryGoalFoldersResSchema,
} from '@dailyuse/contracts/goal';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { GoalFolderId } from '@dailyuse/contracts/primitives';
import type { GoalFolderController } from '../../server/transport/goal-folder.controller';

// ============ Helpers ============

function parseBoolean(value: unknown): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
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
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建目标文件夹',
      request: { body: { content: { 'application/json': { schema: CreateGoalFolderSchema } } } },
      responses: {
        201: successResponse(GoalFolderClientDTOSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, ctx),
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
      controller.list(
        {
          parentFolderId: req.query?.parentFolderId as unknown as GoalFolderId | undefined,
          includeSystemFolders: parseBoolean(req.query?.includeSystemFolders),
          sortBy: req.query?.sortBy as 'name' | 'createdAt' | 'sortOrder' | undefined,
          sortOrder: req.query?.sortOrder as 'asc' | 'desc' | undefined,
        },
        ctx,
      ),
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
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新目标文件夹',
      request: {
        params: z.object({ id: brandedId<GoalFolderId>() }),
        body: { content: { 'application/json': { schema: UpdateGoalFolderSchema } } },
      },
      responses: {
        200: successResponse(GoalFolderClientDTOSchema, '更新成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.update(req.params!.id, req.body, ctx),
  );

  // PATCH /:id — 更新文件夹（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'patch',
      path: '/:id',
      skipOpenApi: true,
    },
    [auth],
    (req, ctx) => controller.update(req.params!.id, req.body, ctx),
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
