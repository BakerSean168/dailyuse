/**
 * Setting API Routes — Unified Route + OpenAPI Registration
 *
 * Routes:
 *   GET    /              — 获取用户设置
 *   PATCH  /:category     — 按分类更新用户设置 (PatchUserSettingSchema)
 *   POST   /reset         — 重置用户设置 (ResetUserSettingSchema)
 *   POST   /export        — 导出设置 (ExportSettingsSchema)
 *   POST   /import        — 导入设置 (ImportSettingsSchema)
 *   GET    /defaults      — 获取默认设置
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
  PatchUserSettingSchema,
  ResetUserSettingSchema,
  ExportSettingsSchema,
  ImportSettingsSchema,
  UserSettingResponseSchema,
  ExportSettingsResponseSchema,
  ImportSettingsResponseSchema,
} from '@dailyuse/contracts/setting';
import { SettingController } from '../controllers/setting.controller';
import type { SettingUseCases } from '../controllers/setting.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerSettingRoutes(
  handlers: SettingUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new SettingController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/settings',
    defaultTags: ['Setting'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET / — 获取用户设置
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取用户设置',
      responses: {
        200: successResponse(UserSettingResponseSchema, '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.getUserSetting(ctx),
  );

  // PATCH /:category — 按分类更新用户设置
  r.route(
    {
      method: 'patch',
      path: '/:category',
      summary: '按分类更新用户设置',
      request: { body: { content: { 'application/json': { schema: z.record(z.unknown()) } } } },
      responses: {
        200: successResponse(UserSettingResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.patchUserSetting(
      { category: req.params.category as string, patch: req.body },
      ctx,
    ),
  );

  // POST /reset — 重置用户设置
  r.route(
    {
      method: 'post',
      path: '/reset',
      summary: '重置用户设置',
      request: { body: { content: { 'application/json': { schema: ResetUserSettingSchema } } } },
      responses: {
        200: successResponse(UserSettingResponseSchema, '重置成功'),
      },
    },
    [auth],
    (req, ctx) => controller.resetUserSetting(req.body, ctx),
  );

  // POST /export — 导出设置
  r.route(
    {
      method: 'post',
      path: '/export',
      summary: '导出设置',
      request: { body: { content: { 'application/json': { schema: ExportSettingsSchema } } } },
      responses: {
        200: successResponse(ExportSettingsResponseSchema, '导出成功'),
      },
    },
    [auth],
    (req, ctx) => controller.exportSettings(req.body, ctx),
  );

  // POST /import — 导入设置
  r.route(
    {
      method: 'post',
      path: '/import',
      summary: '导入设置',
      request: { body: { content: { 'application/json': { schema: ImportSettingsSchema } } } },
      responses: {
        201: successResponse(ImportSettingsResponseSchema, '导入成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.importSettings(req.body, ctx),
    { successStatus: 201 },
  );

  // GET /defaults — 获取默认设置
  r.route(
    {
      method: 'get',
      path: '/defaults',
      summary: '获取默认设置',
      responses: {
        200: successResponse(UserSettingResponseSchema, '获取成功'),
      },
    },
    [auth],
    () => controller.getDefaultSettings(),
    { requireAuth: false },
  );

  return router;
}
