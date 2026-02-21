/**
 * Authentication API Routes — Unified Route + OpenAPI Registration
 *
 * 路由定义与 OpenAPI 文档在同一处注册，消除"双重记账"问题。
 *
 * Routes:
 *   POST   /register   — 用户注册 (RegisterByEmailSchema)
 *   POST   /login      — 用户登录 (LoginByEmailSchema)
 *   POST   /logout     — 用户登出
 *   POST   /refresh    — 刷新访问令牌 (RefreshTokenSchema)
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
  RegisterByEmailSchema,
  LoginByEmailSchema,
  RefreshTokenSchema,
} from '@dailyuse/contracts/authentication';
import { AuthenticationController } from '../controllers/auth.controller';
import type { AuthenticationUseCases } from '../controllers/auth.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Response Schemas ============

const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
});

// ============ Route Registration ============

export function registerAuthenticationRoutes(
  handlers: AuthenticationUseCases,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new AuthenticationController(handlers);

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/auth',
    defaultTags: ['Authentication'],
    defaultSecurity: [],
  });

  // POST /register — 用户注册 (no auth required)
  r.route(
    {
      method: 'post',
      path: '/register',
      summary: '用户注册',
      request: { body: { content: { 'application/json': { schema: RegisterByEmailSchema } } } },
      responses: {
        201: successResponse(AuthResponseSchema, '注册成功'),
        400: errorResponse('参数错误'),
        409: errorResponse('用户已存在'),
      },
    },
    [],
    (req, ctx) => controller.register(req.body, ctx),
    { requireAuth: false, successStatus: 201 },
  );

  // POST /login — 用户登录 (no auth required)
  r.route(
    {
      method: 'post',
      path: '/login',
      summary: '用户登录',
      request: { body: { content: { 'application/json': { schema: LoginByEmailSchema } } } },
      responses: {
        200: successResponse(AuthResponseSchema, '登录成功'),
        400: errorResponse('参数错误'),
        401: errorResponse('认证失败'),
      },
    },
    [],
    (req, ctx) => controller.login(req.body, ctx),
    { requireAuth: false },
  );

  // POST /logout — 用户登出
  r.route(
    {
      method: 'post',
      path: '/logout',
      summary: '用户登出',
      security: [{ bearerAuth: [] }],
      responses: {
        200: successResponse(z.null(), '登出成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (req, ctx) => controller.logout(ctx),
  );

  // POST /refresh — 刷新访问令牌
  r.route(
    {
      method: 'post',
      path: '/refresh',
      summary: '刷新访问令牌',
      security: [{ bearerAuth: [] }],
      request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
      responses: {
        200: successResponse(AuthResponseSchema, '刷新成功'),
        401: errorResponse('令牌无效或已过期'),
      },
    },
    [auth],
    (req, ctx) => controller.refreshToken(req.body, ctx),
  );

  return router;
}
