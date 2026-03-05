/**
 * Folder Routes
 *
 * Routes for repository folder management.
 *
 * Nested under repository:
 *   POST   /repositories/:repoId/folders — Create folder
 *   GET    /repositories/:repoId/folders — Get folder tree
 *
 * Standalone:
 *   GET    /folders/:id        — Get folder
 *   PUT    /folders/:id/rename — Rename folder
 *   PUT    /folders/:id/move   — Move folder
 *   DELETE /folders/:id        — Delete folder
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
import type { RepositoryId, FolderId } from '@dailyuse/contracts/primitives';
import type { RepositoryController } from '../../controllers/repository.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Nested Folder Routes (under /repositories) ============

export function registerNestedFolderRoutes(
  controller: RepositoryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/repositories',
    defaultTags: ['Repository'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /:repoId/folders
  r.route(
    {
      method: 'post',
      path: '/:repoId/folders',
      summary: '创建文件夹',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        body: {
          content: {
            'application/json': {
              schema: z.object({
                name: z.string().min(1),
                parentId: z.string().optional(),
                order: z.number().optional(),
              }),
            },
          },
        },
      },
      responses: {
        201: successResponse(z.object({}).passthrough(), '创建成功'),
        400: errorResponse('参数错误'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req, ctx) => controller.createFolder(req.params!.repoId, req.body, ctx),
    { successStatus: 201 },
  );

  // GET /:repoId/folders
  r.route(
    {
      method: 'get',
      path: '/:repoId/folders',
      summary: '获取文件夹树',
      request: { params: z.object({ repoId: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(z.array(z.object({}).passthrough()), '获取成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.getFolderTree(req.params!.repoId),
  );

  return router;
}

// ============ Standalone Folder Routes (under /folders) ============

export function registerStandaloneFolderRoutes(
  controller: RepositoryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/folders',
    defaultTags: ['Repository'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET /:id
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取文件夹详情',
      request: { params: z.object({ id: brandedId<FolderId>() }) },
      responses: {
        200: successResponse(z.object({}).passthrough(), '获取成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req) => controller.getFolder(req.params!.id),
  );

  // PUT /:id/rename
  r.route(
    {
      method: 'put',
      path: '/:id/rename',
      summary: '重命名文件夹',
      request: {
        params: z.object({ id: brandedId<FolderId>() }),
        body: { content: { 'application/json': { schema: z.object({ name: z.string().min(1) }) } } },
      },
      responses: {
        200: successResponse(z.object({}).passthrough(), '重命名成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req) => controller.renameFolder(req.params!.id, req.body),
  );

  // PUT /:id/move
  r.route(
    {
      method: 'put',
      path: '/:id/move',
      summary: '移动文件夹',
      request: {
        params: z.object({ id: brandedId<FolderId>() }),
        body: { content: { 'application/json': { schema: z.object({ parentId: z.string().nullable().optional() }) } } },
      },
      responses: {
        200: successResponse(z.object({}).passthrough(), '移动成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req) => controller.moveFolder(req.params!.id, req.body),
  );

  // DELETE /:id
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除文件夹',
      request: { params: z.object({ id: brandedId<FolderId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('文件夹不存在'),
      },
    },
    [auth],
    (req) => controller.deleteFolder(req.params!.id),
  );

  return router;
}
