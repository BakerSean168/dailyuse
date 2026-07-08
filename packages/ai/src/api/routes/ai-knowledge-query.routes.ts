import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  errorResponse,
  successResponse,
} from '@dailyuse/utils/result';
import {
  ExpandKnowledgeSchema,
  QueryKnowledgeSchema,
  ReindexKnowledgeResultItemSchema,
  ReindexKnowledgeSchema,
  QueryKnowledgeResSchema,
  ExpandKnowledgeResSchema,
} from '@dailyuse/contracts/ai';
import type { AIKnowledgeQueryController } from '../../server/transport/ai-knowledge-query.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIKnowledgeQueryRoutes(
  controller: AIKnowledgeQueryController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/knowledge',
    defaultTags: ['AI Knowledge'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'post',
      path: '/expand',
      summary: '扩写知识内容',
      request: { body: { content: { 'application/json': { schema: ExpandKnowledgeSchema } } } },
      responses: {
        200: successResponse(ExpandKnowledgeResSchema, '扩写成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.expand(req.body, { identityId: ctx.identityId } as ExecutionContext),
  );

  r.route(
    {
      method: 'post',
      path: '/query',
      summary: '查询知识库',
      request: { body: { content: { 'application/json': { schema: QueryKnowledgeSchema } } } },
      responses: {
        200: successResponse(QueryKnowledgeResSchema, '查询成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.query(req.body, { identityId: ctx.identityId } as ExecutionContext),
  );

  r.route(
    {
      method: 'post',
      path: '/reindex',
      summary: '重建知识索引',
      request: { body: { content: { 'application/json': { schema: ReindexKnowledgeSchema } } } },
      responses: {
        200: successResponse(
          z.object({
            indexedCount: z.number().int().nonnegative(),
            reusedCount: z.number().int().nonnegative(),
            failedCount: z.number().int().nonnegative(),
            results: z.array(ReindexKnowledgeResultItemSchema),
          }),
          '重建成功',
        ),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.reindex(req.body, { identityId: ctx.identityId } as ExecutionContext),
  );

  return router;
}
