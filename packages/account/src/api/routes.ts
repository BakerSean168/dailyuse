/**
 * Account API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   GET    /me             — 获取当前用户资料
 *   PUT    /me             — 更新当前用户资料 (UpdateAccountSchema)
 *   POST   /availability   — 检查可用性 (CheckAvailabilitySchema)
 *   POST   /me/close       — 注销账户 (CloseAccountSchema)
 *   DELETE /me             — 注销账户（别名）
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
  UpdateAccountSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
  AccountResponseSchema,
  AvailabilityResponseSchema,
} from '@dailyuse/contracts/account';
import { AccountController } from '../controllers/account.controller';
import type { AccountUseCases } from '../controllers/account.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerAccountRoutes(
  handlers: AccountUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new AccountController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/accounts',
    defaultTags: ['Account'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // GET /me — 获取当前用户资料
  r.route(
    {
      method: 'get',
      path: '/me',
      summary: '获取当前用户资料',
      responses: {
        200: successResponse(AccountResponseSchema, '获取成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (_req, ctx) => controller.getProfile(ctx),
  );

  // PUT /me — 更新当前用户资料
  r.route(
    {
      method: 'put',
      path: '/me',
      summary: '更新当前用户资料',
      request: { body: { content: { 'application/json': { schema: UpdateAccountSchema } } } },
      responses: {
        200: successResponse(AccountResponseSchema, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.updateProfile(req.body, ctx),
  );

  // POST /availability — 检查可用性
  r.route(
    {
      method: 'post',
      path: '/availability',
      summary: '检查账号可用性',
      request: { body: { content: { 'application/json': { schema: CheckAvailabilitySchema } } } },
      responses: {
        200: successResponse(AvailabilityResponseSchema, '检查成功'),
      },
    },
    [auth],
    (req) => controller.checkAvailability(req.body),
  );

  // POST /me/close — 注销账户
  r.route(
    {
      method: 'post',
      path: '/me/close',
      summary: '注销账户',
      request: { body: { content: { 'application/json': { schema: CloseAccountSchema } } } },
      responses: {
        200: successResponse(z.null(), '注销成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.closeAccount(req.body, ctx),
  );

  // DELETE /me — 注销账户（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'delete',
      path: '/me',
      skipOpenApi: true,
    },
    [auth],
    (req, ctx) => controller.closeAccount(req.body, ctx),
  );

  return router;
}
