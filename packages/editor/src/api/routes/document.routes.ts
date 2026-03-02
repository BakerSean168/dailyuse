/**
 * Editor Document Routes
 *
 * 文档的增删改查路由。
 *
 * Routes:
 *   POST   /documents           — Create document
 *   GET    /documents           — List documents
 *   GET    /documents/:id       — Get document by ID
 *   PUT    /documents/:id       — Update document
 *   DELETE /documents/:id       — Delete document
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
  CreateDocumentSchema,
  UpdateDocumentSchema,
  DocumentResponseSchema,
} from '@dailyuse/contracts/editor';
import type { EditorController } from '../../controllers/editor.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerDocumentRoutes(
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
    (req, ctx) =>
      controller.listDocuments(
        {
          workspaceId: req.query?.workspaceId as string | undefined,
          folderId: req.query?.folderId as string | undefined,
        },
        ctx,
      ),
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
