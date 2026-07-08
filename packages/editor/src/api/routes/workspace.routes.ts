/**
 * Editor Workspace Routes
 *
 * 工作区的增删改查路由。
 *
 * Routes:
 *   POST   /workspaces          — Create workspace
 *   GET    /workspaces          — List workspaces
 *   GET    /workspaces/:id      — Get workspace by ID
 *   PUT    /workspaces/:id      — Update workspace
 *   DELETE /workspaces/:id      — Delete workspace
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
  CreateEditorWorkspaceSchema,
  UpdateEditorWorkspaceSchema,
  WorkspaceResponseSchema,
} from '@dailyuse/contracts/editor';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { EditorWorkspaceId } from '@dailyuse/contracts/primitives';
import type { EditorController } from '../../server/transport/editor.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerWorkspaceRoutes(
  controller: EditorController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/editor',
    defaultTags: ['Editor'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST /workspaces — Create workspace
  r.route(
    {
      method: 'post',
      path: '/workspaces',
      summary: '创建工作区',
      request: {
        body: { content: { 'application/json': { schema: CreateEditorWorkspaceSchema } } },
      },
      responses: {
        201: successResponse(WorkspaceResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createWorkspace(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /workspaces — List workspaces
  r.route(
    {
      method: 'get',
      path: '/workspaces',
      summary: '获取工作区列表',
      responses: {
        200: successResponse(z.array(WorkspaceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.listWorkspaces(ctx),
  );

  // GET /workspaces/:id — Get workspace by ID
  r.route(
    {
      method: 'get',
      path: '/workspaces/:id',
      summary: '获取工作区详情',
      request: { params: z.object({ id: brandedId<EditorWorkspaceId>() }) },
      responses: {
        200: successResponse(WorkspaceResponseSchema, '获取成功'),
        404: errorResponse('工作区不存在'),
      },
    },
    [auth],
    (req) => controller.getWorkspace(req.params!.id),
  );

  // PUT /workspaces/:id — Update workspace
  r.route(
    {
      method: 'put',
      path: '/workspaces/:id',
      summary: '更新工作区',
      request: {
        params: z.object({ id: brandedId<EditorWorkspaceId>() }),
        body: { content: { 'application/json': { schema: UpdateEditorWorkspaceSchema } } },
      },
      responses: {
        200: successResponse(WorkspaceResponseSchema, '更新成功'),
        404: errorResponse('工作区不存在'),
      },
    },
    [auth],
    (req) => controller.updateWorkspace(req.params!.id, req.body),
  );

  // DELETE /workspaces/:id — Delete workspace
  r.route(
    {
      method: 'delete',
      path: '/workspaces/:id',
      summary: '删除工作区',
      request: { params: z.object({ id: brandedId<EditorWorkspaceId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('工作区不存在'),
      },
    },
    [auth],
    (req) => controller.deleteWorkspace(req.params!.id),
  );

  return router;
}
