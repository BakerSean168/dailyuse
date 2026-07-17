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
  SendEmailCodeSchema,
  VerifyEmailCodeSchema,
  SendSmsCodeSchema,
  OAuthCallbackSchema,
  CurrentUserResponseSchema,
  SessionListResponseSchema,
} from '@dailyuse/contracts/authentication';
import { AuthenticationController } from '../server/transport';
import type { AuthenticationApplicationPort } from '../server/application';
import { createDefaultAuthChallengeIpRateLimit } from './challenge-ip-rate-limit';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
  /**
   * Optional email-verification gate applied after JWT auth on sensitive routes.
   * 可选：JWT 之后叠加的邮箱验证门禁。
   */
  readonly requireEmailVerified?: RequestHandler;
}

export function registerAuthenticationRoutes(
  api: AuthenticationApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth, requireEmailVerified } = middleware;
  const controller = new AuthenticationController(api);
  const challengeIpLimit = createDefaultAuthChallengeIpRateLimit('auth-challenge');
  // Sensitive authenticated routes: JWT + optional Unverified gate.
  const guardedAuth: RequestHandler[] = requireEmailVerified
    ? [auth, requireEmailVerified]
    : [auth];

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
      path: '/oauth/callback',
      summary: 'OAuth 登录回调（当前支持 GitHub）',
      request: { body: { content: { 'application/json': { schema: OAuthCallbackSchema } } } },
      responses: {
        200: successResponse(AuthResponseSchema, '登录成功'),
        400: errorResponse('参数错误或不支持的登录方式'),
        401: errorResponse('认证失败'),
        503: errorResponse('该 OAuth 提供者未启用'),
      },
    },
    [],
    (req, ctx) => controller.oauthCallback(req.body, ctx),
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
    [...guardedAuth],
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
    [...guardedAuth],
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
        429: errorResponse('请求过于频繁'),
      },
    },
    [challengeIpLimit],
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

  r.route(
    {
      method: 'post',
      path: '/email/send-code',
      summary: '发送邮箱验证码',
      request: { body: { content: { 'application/json': { schema: SendEmailCodeSchema } } } },
      responses: {
        200: successResponse(z.null(), '请求已接收'),
        422: errorResponse('参数验证失败'),
        429: errorResponse('请求过于频繁'),
      },
    },
    [challengeIpLimit],
    (req, ctx) => controller.sendEmailCode(req.body, ctx),
    { requireAuth: false },
  );

  r.route(
    {
      method: 'post',
      path: '/email/verify',
      summary: '校验邮箱验证码',
      request: { body: { content: { 'application/json': { schema: VerifyEmailCodeSchema } } } },
      responses: {
        200: successResponse(z.object({ identity: z.any().optional() }), '验证成功'),
        422: errorResponse('参数验证失败'),
      },
    },
    [],
    (req, ctx) => controller.verifyEmailCode(req.body, ctx),
    { requireAuth: false },
  );


  return router;
}
