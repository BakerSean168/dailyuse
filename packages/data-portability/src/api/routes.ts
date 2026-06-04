/**
 * Data Portability API Routes
 *
 * Routes:
 *   POST /export — 导出用户数据
 *   POST /import — 导入用户数据
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { RouteRegistrar, type OpenApiRegistryLike, successResponse, errorResponse } from '@dailyuse/utils/result';
import {
  ExportUserDataReqSchema,
  ImportUserDataReqSchema,
  ExportUserDataResSchema,
  ImportUserDataResSchema,
} from '../contracts/portable-schema';
import { DataPortabilityController } from './controller';
import type { DataPortabilityUseCases } from './controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerDataPortabilityRoutes(
  handlers: DataPortabilityUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new DataPortabilityController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/data-portability',
    defaultTags: ['DataPortability'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'post',
      path: '/export',
      summary: '导出用户数据',
      request: { body: { content: { 'application/json': { schema: ExportUserDataReqSchema } } } },
      responses: {
        200: successResponse(ExportUserDataResSchema, '导出成功'),
      },
    },
    [auth],
    (req, ctx) => controller.exportUserData(req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/import',
      summary: '导入用户数据',
      request: { body: { content: { 'application/json': { schema: ImportUserDataReqSchema } } } },
      responses: {
        201: successResponse(ImportUserDataResSchema, '导入成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.importUserData(req.body, ctx),
    { successStatus: 201 },
  );

  return router;
}
