/**
 * Editor Search Routes
 */

import { Router, type RequestHandler } from 'express';
import { RouteRegistrar, type OpenApiRegistryLike, successResponse } from '@dailyuse/utils/result';
import { SearchEditorResourcesSchema, SearchResponseSchema } from '@dailyuse/contracts/editor';
import type { EditorController } from '../../server/transport/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerSearchRoutes(
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

  r.route(
    {
      method: 'get',
      path: '/search',
      summary: '搜索资源',
      request: { query: SearchEditorResourcesSchema },
      responses: {
        200: successResponse(SearchResponseSchema, '搜索成功'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.searchResources(
        {
          query: typeof req.query?.query === 'string' ? req.query.query : '',
          limit:
            typeof req.query?.limit === 'string' && req.query.limit.length > 0
              ? Number(req.query.limit)
              : undefined,
          offset:
            typeof req.query?.offset === 'string' && req.query.offset.length > 0
              ? Number(req.query.offset)
              : undefined,
          workspaceId:
            typeof req.query?.workspaceId === 'string' ? req.query.workspaceId : undefined,
          searchEngineId:
            typeof req.query?.searchEngineId === 'string' ? req.query.searchEngineId : undefined,
        },
        ctx,
      ),
  );

  return router;
}
