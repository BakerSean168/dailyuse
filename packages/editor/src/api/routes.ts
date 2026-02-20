/**
 * Editor API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /workspaces          — Create workspace
 *   GET    /workspaces          — List workspaces
 *   GET    /workspaces/:id      — Get workspace by ID
 *   PUT    /workspaces/:id      — Update workspace
 *   DELETE /workspaces/:id      — Delete workspace
 *   POST   /documents           — Create document
 *   GET    /documents           — List documents
 *   GET    /documents/:id       — Get document by ID
 *   PUT    /documents/:id       — Update document
 *   DELETE /documents/:id       — Delete document
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
  CreateEditorWorkspaceSchema,
  UpdateEditorWorkspaceSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from '@dailyuse/contracts/editor';
import { EditorController } from '../controllers/editor.controller';
import type { EditorUseCases } from '../controllers/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Response Schemas ============

const WorkspaceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  projectPath: z.string(),
  projectType: z.string(),
  isActive: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  language: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============ Route Registration ============

export function registerEditorRoutes(
  handlers: EditorUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new EditorController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/editor',
    defaultTags: ['Editor'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // ============ Workspace Routes ============

  // POST /workspaces — Create workspace
  r.route(
    {
      method: 'post',
      path: '/workspaces',
      summary: '创建工作区',
      request: { body: { content: { 'application/json': { schema: CreateEditorWorkspaceSchema } } } },
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
      request: { params: z.object({ id: z.string().uuid() }) },
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
        params: z.object({ id: z.string().uuid() }),
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
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('工作区不存在'),
      },
    },
    [auth],
    (req) => controller.deleteWorkspace(req.params!.id),
  );

  // ============ Document Routes ============

  // POST /documents — Create document
  r.route(
    {
      method: 'post',
      path: '/documents',
      summary: '创建文档',
      request: { body: { content: { 'application/json': { schema: CreateDocumentSchema } } } },
      responses: {
        201: successResponse(DocumentResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createDocument(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /documents — List documents
  r.route(
    {
      method: 'get',
      path: '/documents',
      summary: '获取文档列表',
      request: {
        query: z.object({
          workspaceId: z.string().uuid().optional(),
          folderId: z.string().uuid().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(DocumentResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listDocuments({
      workspaceId: req.query?.workspaceId as string | undefined,
      folderId: req.query?.folderId as string | undefined,
    }, ctx),
  );

  // GET /documents/:id — Get document by ID
  r.route(
    {
      method: 'get',
      path: '/documents/:id',
      summary: '获取文档详情',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(DocumentResponseSchema, '获取成功'),
        404: errorResponse('文档不存在'),
      },
    },
    [auth],
    (req) => controller.getDocument(req.params!.id),
  );

  // PUT /documents/:id — Update document
  r.route(
    {
      method: 'put',
      path: '/documents/:id',
      summary: '更新文档',
      request: {
        params: z.object({ id: z.string().uuid() }),
        body: { content: { 'application/json': { schema: UpdateDocumentSchema } } },
      },
      responses: {
        200: successResponse(DocumentResponseSchema, '更新成功'),
        404: errorResponse('文档不存在'),
      },
    },
    [auth],
    (req) => controller.updateDocument(req.params!.id, req.body),
  );

  // DELETE /documents/:id — Delete document
  r.route(
    {
      method: 'delete',
      path: '/documents/:id',
      summary: '删除文档',
      request: { params: z.object({ id: z.string().uuid() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('文档不存在'),
      },
    },
    [auth],
    (req) => controller.deleteDocument(req.params!.id),
  );

  return router;
}
