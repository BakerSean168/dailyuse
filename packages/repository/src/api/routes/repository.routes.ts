/**
 * Repository CRUD Routes
 *
 * 仓库的增删改查及归档/激活操作，以及嵌套的资源路由。
 *
 * Routes:
 *   POST   /                    — Create repository
 *   GET    /                    — List repositories
 *   GET    /:id                 — Get repository by ID
 *   PUT    /:id                 — Update repository
 *   DELETE /:id                 — Delete repository
 *   POST   /:id/archive         — Archive repository
 *   POST   /:id/activate        — Activate repository
 *   POST   /:repoId/resources   — Create resource (nested)
 *   GET    /:repoId/resources   — List resources (nested)
 */

import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateRepositorySchema,
  UpdateRepositorySchema,
  CreateResourceSchema,
  CreateResourceBookmarkSchema,
  UpdateResourceBookmarkSchema,
  ReorderResourceBookmarksSchema,
  RepositoryResponseSchema,
  ResourceResponseSchema,
  ResourceBookmarkResponseSchema,
  UploadResourcesResponseSchema,
} from '@dailyuse/contracts/repository';
import { brandedId } from '@dailyuse/contracts/primitives';
import type { RepositoryId, FolderId } from '@dailyuse/contracts/primitives';
import type { RepositoryController } from '../../controllers/repository.controller';
import type { UploadResourcesRequestDTO } from '@dailyuse/contracts/repository';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerRepositoryCrudRoutes(
  controller: RepositoryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const upload = multer({ storage: multer.memoryStorage() });

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/repositories',
    defaultTags: ['Repository'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create repository
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建仓库',
      request: { body: { content: { 'application/json': { schema: CreateRepositorySchema } } } },
      responses: {
        201: successResponse(RepositoryResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.createRepository(req.body, ctx),
    { successStatus: 201 },
  );

  router.post('/:repoId/resources/upload', auth, upload.array('files'), async (req, res) => {
    const ctx = { identityId: (req as any).user?.identityId ?? '', deviceId: 'unknown' } as any;
    try {
      const tags = parseUploadTags(req.body?.tags);
      const metadata: UploadResourcesRequestDTO = {
        folderId: typeof req.body?.folderId === 'string' ? req.body.folderId : undefined,
        overwritePolicy:
          req.body?.overwritePolicy === 'replace'
            ? 'replace'
            : req.body?.overwritePolicy === 'skip'
              ? 'skip'
              : undefined,
        tags,
      };

      const files = ((req.files as Express.Multer.File[]) ?? []).map((file) => ({
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        contentBase64: file.buffer.toString('base64'),
      }));

      const result = await controller.uploadResources(req.params!.repoId, files, metadata, ctx);
      const hasFailures =
        result.ok &&
        Array.isArray((result.data as any)?.failures) &&
        (result.data as any).failures.length > 0;
      const status = result.ok ? (hasFailures ? 207 : 200) : 422;
      res.status(status).json({
        ok: result.ok,
        code: status,
        message: result.ok ? '操作成功' : result.error.message,
        data: result.ok ? result.data : undefined,
        error: result.ok ? undefined : result.error,
        timestamp: Date.now(),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        code: 500,
        message: error instanceof Error ? error.message : 'Upload failed',
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
        timestamp: Date.now(),
      });
    }
  });

  if (openApiRegistry) {
    openApiRegistry.registerPath({
      method: 'post',
      path: '/api/v1/repositories/{repoId}/resources/upload',
      tags: ['Repository'],
      summary: '上传资源',
      security: [{ bearerAuth: [] }],
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        body: {
          content: {
            'multipart/form-data': {
              schema: z.object({
                files: z.any(),
                folderId: z.string().optional(),
                tags: z.union([z.string(), z.array(z.string())]).optional(),
                overwritePolicy: z.enum(['skip', 'replace']).optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: successResponse(UploadResourcesResponseSchema, '上传完成'),
        207: successResponse(UploadResourcesResponseSchema, '部分上传成功'),
        422: errorResponse('部分或全部上传失败'),
      },
    });
  }

  // GET / — List repositories
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取仓库列表',
      request: {
        query: z.object({
          status: z.string().optional(),
          type: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(RepositoryResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listRepositories(
        {
          status: typeof req.query?.status === 'string' ? req.query.status : undefined,
          type: typeof req.query?.type === 'string' ? req.query.type : undefined,
        },
        ctx,
      ),
  );

  r.route(
    {
      method: 'get',
      path: '/current',
      summary: '获取当前仓库',
      responses: {
        200: successResponse(RepositoryResponseSchema.nullable(), '获取成功'),
        409: errorResponse('检测到多个仓库，无法确定当前仓库'),
      },
    },
    [auth],
    (_req, ctx) => controller.getCurrentRepository(ctx),
  );

  r.route(
    {
      method: 'get',
      path: '/:repoId/bookmarks',
      summary: '获取书签列表',
      request: { params: z.object({ repoId: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(z.array(ResourceBookmarkResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req, ctx) => controller.listResourceBookmarks(req.params!.repoId, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/:repoId/bookmarks',
      summary: '创建书签',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        body: { content: { 'application/json': { schema: CreateResourceBookmarkSchema } } },
      },
      responses: {
        201: successResponse(ResourceBookmarkResponseSchema, '创建成功'),
      },
    },
    [auth],
    (req, ctx) => controller.createResourceBookmark(req.params!.repoId, req.body, ctx),
    { successStatus: 201 },
  );

  r.route(
    {
      method: 'patch',
      path: '/:repoId/bookmarks/:bookmarkId',
      summary: '更新书签',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>(), bookmarkId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: UpdateResourceBookmarkSchema } } },
      },
      responses: {
        200: successResponse(ResourceBookmarkResponseSchema, '更新成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.updateResourceBookmark(req.params!.repoId, req.params!.bookmarkId, req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/:repoId/bookmarks/reorder',
      summary: '重排书签',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        body: { content: { 'application/json': { schema: ReorderResourceBookmarksSchema } } },
      },
      responses: {
        200: successResponse(z.array(ResourceBookmarkResponseSchema), '更新成功'),
      },
    },
    [auth],
    (req, ctx) => controller.reorderResourceBookmarks(req.params!.repoId, req.body, ctx),
  );

  r.route(
    {
      method: 'delete',
      path: '/:repoId/bookmarks/:bookmarkId',
      summary: '删除书签',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>(), bookmarkId: z.string().min(1) }),
      },
      responses: {
        200: successResponse(z.object({ ok: z.boolean() }), '删除成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.deleteResourceBookmark(req.params!.repoId, req.params!.bookmarkId, ctx),
  );

  // GET /:id — Get repository by ID
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取仓库详情',
      request: { params: z.object({ id: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '获取成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.getRepository(req.params!.id),
  );

  // PUT /:id — Update repository
  r.route(
    {
      method: 'put',
      path: '/:id',
      summary: '更新仓库',
      request: {
        params: z.object({ id: brandedId<RepositoryId>() }),
        body: { content: { 'application/json': { schema: UpdateRepositorySchema } } },
      },
      responses: {
        200: successResponse(RepositoryResponseSchema, '更新成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.updateRepository(req.params!.id, req.body),
  );

  // DELETE /:id — Delete repository
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除仓库',
      request: { params: z.object({ id: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(z.null(), '删除成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.deleteRepository(req.params!.id),
  );

  // POST /:id/archive — Archive repository
  r.route(
    {
      method: 'post',
      path: '/:id/archive',
      summary: '归档仓库',
      request: { params: z.object({ id: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '归档成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.archiveRepository(req.params!.id),
  );

  // POST /:id/activate — Activate repository
  r.route(
    {
      method: 'post',
      path: '/:id/activate',
      summary: '激活仓库',
      request: { params: z.object({ id: brandedId<RepositoryId>() }) },
      responses: {
        200: successResponse(RepositoryResponseSchema, '激活成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.activateRepository(req.params!.id),
  );

  // ── Nested Resource Routes ───────────────────────────────────────

  // POST /:repoId/resources — Create resource
  r.route(
    {
      method: 'post',
      path: '/:repoId/resources',
      summary: '创建资源',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        body: { content: { 'application/json': { schema: CreateResourceSchema } } },
      },
      responses: {
        201: successResponse(ResourceResponseSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req) =>
      controller.createResource(req.params!.repoId, req.body, {
        identityId: req.user?.identityId || 'api-user',
      } as any),
    { successStatus: 201 },
  );

  // GET /:repoId/resources — List resources
  r.route(
    {
      method: 'get',
      path: '/:repoId/resources',
      summary: '获取资源列表',
      request: {
        params: z.object({ repoId: brandedId<RepositoryId>() }),
        query: z.object({
          folderId: brandedId<FolderId>().optional(),
          status: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(ResourceResponseSchema), '获取成功'),
      },
    },
    [auth],
    (req) =>
      controller.listResources(req.params!.repoId, {
        folderId: typeof req.query?.folderId === 'string' ? req.query.folderId : undefined,
        status: typeof req.query?.status === 'string' ? req.query.status : undefined,
      }),
  );

  // PUT /:id/stats — Update repository stats
  r.route(
    {
      method: 'put',
      path: '/:id/stats',
      summary: '更新仓库统计信息',
      request: {
        params: z.object({ id: brandedId<RepositoryId>() }),
        body: { content: { 'application/json': { schema: z.object({}).passthrough() } } },
      },
      responses: {
        200: successResponse(RepositoryResponseSchema, '更新成功'),
        404: errorResponse('仓库不存在'),
      },
    },
    [auth],
    (req) => controller.updateRepositoryStats(req.params!.id, req.body),
  );

  return router;
}

function parseUploadTags(input: unknown): string[] | undefined {
  if (Array.isArray(input)) {
    return input.flatMap((item) => parseUploadTags(item) ?? []);
  }
  if (typeof input !== 'string' || input.trim().length === 0) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}
