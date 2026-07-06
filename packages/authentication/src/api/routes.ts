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
  ChangePasswordSchema,
  ForgotPasswordSchema,
  RegisterByEmailSchema,
  RegisterByPhoneSchema,
  LoginByEmailSchema,
  LoginByPhoneSchema,
  RefreshTokenSchema,
  AuthResponseSchema,
  RevokeSessionSchema,
  ResetPasswordSchema,
  SendSmsCodeSchema,
  CurrentUserResponseSchema,
  SessionListResponseSchema,
} from '@dailyuse/contracts/authentication';
import { AuthenticationController } from '../controllers/auth.controller';
import type { AuthenticationUseCases } from '../controllers/auth.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

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

  r.route(
    {
      method: 'post',
      path: '/register/phone',
      summary: '手机号注册',
      request: { body: { content: { 'application/json': { schema: RegisterByPhoneSchema } } } },
      responses: {
        201: successResponse(AuthResponseSchema, '注册成功'),
        400: errorResponse('参数错误'),
        503: errorResponse('服务暂不可用'),
      },
    },
    [],
    (req, ctx) => controller.registerByPhone(req.body, ctx),
    { requireAuth: false, successStatus: 201 },
  );

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

  r.route(
    {
      method: 'post',
      path: '/login/phone',
      summary: '手机号登录',
      request: { body: { content: { 'application/json': { schema: LoginByPhoneSchema } } } },
      responses: {
        200: successResponse(AuthResponseSchema, '登录成功'),
        400: errorResponse('参数错误'),
        503: errorResponse('服务暂不可用'),
      },
    },
    [],
    (req, ctx) => controller.loginByPhone(req.body, ctx),
    { requireAuth: false },
  );

  r.route(
    {
      method: 'post',
      path: '/sms/send',
      summary: '发送短信验证码',
      request: { body: { content: { 'application/json': { schema: SendSmsCodeSchema } } } },
      responses: {
        200: successResponse(z.null(), '发送成功'),
        400: errorResponse('参数错误'),
        503: errorResponse('服务暂不可用'),
      },
    },
    [],
    (req) => controller.sendSmsCode(req.body),
    { requireAuth: false },
  );

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

  r.route(
    {
      method: 'get',
      path: '/me',
      summary: '获取当前用户',
      security: [{ bearerAuth: [] }],
      responses: {
        200: successResponse(CurrentUserResponseSchema, '获取成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (req, ctx) => controller.getCurrentUser(ctx, req.user?.sessionId),
  );

  r.route(
    {
      method: 'get',
      path: '/sessions',
      summary: '获取当前用户会话列表',
      security: [{ bearerAuth: [] }],
      responses: {
        200: successResponse(SessionListResponseSchema, '获取成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (req, ctx) => controller.listSessions(ctx, req.user?.sessionId),
  );

  r.route(
    {
      method: 'post',
      path: '/sessions/revoke',
      summary: '撤销指定会话',
      security: [{ bearerAuth: [] }],
      request: { body: { content: { 'application/json': { schema: RevokeSessionSchema } } } },
      responses: {
        200: successResponse(z.null(), '撤销成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (req, ctx) => controller.revokeSession(req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/refresh',
      summary: '刷新访问令牌',
      request: { body: { content: { 'application/json': { schema: RefreshTokenSchema } } } },
      responses: {
        200: successResponse(AuthResponseSchema, '刷新成功'),
        401: errorResponse('令牌无效或已过期'),
      },
    },
    [],
    (req, ctx) => controller.refreshToken(req.body, ctx),
    { requireAuth: false },
  );

  r.route(
    {
      method: 'post',
      path: '/password/change',
      summary: '修改密码',
      security: [{ bearerAuth: [] }],
      request: { body: { content: { 'application/json': { schema: ChangePasswordSchema } } } },
      responses: {
        200: successResponse(z.null(), '密码修改成功'),
        401: errorResponse('未认证'),
      },
    },
    [auth],
    (req, ctx) => controller.changePassword(req.body, ctx),
  );

  r.route(
    {
      method: 'post',
      path: '/password/forgot',
      summary: '发起密码重置',
      request: { body: { content: { 'application/json': { schema: ForgotPasswordSchema } } } },
      responses: {
        200: successResponse(z.null(), '请求已接收'),
        422: errorResponse('参数验证失败'),
      },
    },
    [],
    (req) => controller.forgotPassword(req.body),
    { requireAuth: false },
  );

  r.route(
    {
      method: 'post',
      path: '/password/reset',
      summary: '重置密码',
      request: { body: { content: { 'application/json': { schema: ResetPasswordSchema } } } },
      responses: {
        200: successResponse(z.null(), '密码重置成功'),
        404: errorResponse('资源不存在'),
        422: errorResponse('参数验证失败'),
      },
    },
    [],
    (req) => controller.resetPassword(req.body),
    { requireAuth: false },
  );

  return router;
}
