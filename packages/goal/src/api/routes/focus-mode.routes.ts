/**
 * Focus mode routes.
 * 专注模式路由。
 */

import { Router, type RequestHandler } from 'express';
import { RouteRegistrar, type OpenApiRegistryLike, successResponse } from '@dailyuse/utils/result';
import { ActivateFocusModeSchema, ExtendFocusModeSchema, FocusModeClientDTOSchema } from '@dailyuse/contracts/goal';
import type { GoalController } from '../../server/transport/goal.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerFocusModeRoutes(
  controller: GoalController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/goals',
    defaultTags: ['Goal', 'FocusMode'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'get',
      path: '/focus-mode',
      summary: '获取当前专注模式',
      responses: { 200: successResponse(FocusModeClientDTOSchema, '获取成功') },
    },
    [auth],
    (_req, ctx) => controller.getCurrentFocusMode(ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/focus-mode/activate',
      summary: '激活专注模式',
      request: { body: { content: { 'application/json': { schema: ActivateFocusModeSchema } } } },
      responses: { 200: successResponse(FocusModeClientDTOSchema, '激活成功') },
    },
    [auth],
    (req, ctx) => controller.activateFocusMode(req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/focus-mode/deactivate',
      summary: '停用专注模式',
      responses: { 200: successResponse(FocusModeClientDTOSchema, '停用成功') },
    },
    [auth],
    (_req, ctx) => controller.deactivateFocusMode(ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/focus-mode/extend',
      summary: '延长专注模式',
      request: { body: { content: { 'application/json': { schema: ExtendFocusModeSchema } } } },
      responses: { 200: successResponse(FocusModeClientDTOSchema, '延长成功') },
    },
    [auth],
    (req, ctx) => controller.extendFocusMode(req.body, ctx),
  );

  return router;
}
