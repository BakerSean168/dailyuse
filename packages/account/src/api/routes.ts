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

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@memoflow/utils/result';
import {
  UpdateAccountSchema,
  UpdateAccountSettingsSchema,
  CheckAvailabilitySchema,
  CloseAccountSchema,
  AccountResponseSchema,
  AvailabilityResponseSchema,
  AccountClosureReceiptSchema,} from '@memoflow/contracts/account';
import {
  OperationTimelineEntrySchema,
  OperationAuditRecordSchema,
} from '@memoflow/contracts/operations';
import { AccountController } from '../server/transport';
import type { AccountApplicationPort } from '../server/application';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
  readonly requireEmailVerified?: RequestHandler;
}

// ============ Route Registration ============

export function registerAccountRoutes(
  api: AccountApplicationPort,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth, requireEmailVerified } = middleware;
  const controller = new AccountController(api);
  // Profile reads allowed for Unverified (show banner); mutations gated.
  const writeAuth: RequestHandler[] = requireEmailVerified ? [auth, requireEmailVerified] : [auth];
  const readAuth: RequestHandler[] = [auth];

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
    [...readAuth],
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
    [...writeAuth],
    (req, ctx) => controller.updateProfile(req.body, ctx),
  );

  r.route(
    {
      method: 'patch',
      path: '/me/settings',
      summary: '更新账户设置',
      request: {
        body: { content: { 'application/json': { schema: UpdateAccountSettingsSchema } } },
      },
      responses: {
        200: successResponse(AccountResponseSchema.shape.settings, '更新成功'),
        400: errorResponse('参数错误'),
      },
    },
    [...writeAuth],
    (req, ctx) => controller.updateSettings(req.body, ctx),
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
    [...writeAuth],
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
        200: successResponse(AccountClosureReceiptSchema, '注销成功'),
        400: errorResponse('参数错误'),
      },
    },
    [...writeAuth],
    (req, ctx) => controller.closeAccount(req.body, ctx),
  );

  // DELETE /me — 注销账户（别名，跳过 OpenAPI 避免重复）
  r.route(
    {
      method: 'delete',
      path: '/me',
      skipOpenApi: true,
    },
    [...writeAuth],
    (req, ctx) => controller.closeAccount(req.body, ctx),
  );

  // GET /operations/closure/timeline — W7 closure operation timeline (identity-scoped)
  r.route(
    {
      method: 'get',
      path: '/operations/closure/timeline',
      summary: '查询账户关闭 operation timeline（W7）',
      responses: {
        200: successResponse(z.array(OperationTimelineEntrySchema), '获取成功'),
      },
    },
    [...readAuth],
    (_req, ctx) => controller.queryClosureTimeline(ctx),
  );

  // POST /operations/closure/:id/replay — W7 replay failed closure operation (audited)
  r.route(
    {
      method: 'post',
      path: '/operations/closure/:id/replay',
      summary: '重放失败的账户关闭操作并记录审计（W7）',
      request: { params: z.object({ id: z.string().min(1) }) },
      responses: {
        200: successResponse(OperationTimelineEntrySchema, '重放成功'),
        404: errorResponse('操作不存在'),
      },
    },
    [...writeAuth],
    (req, ctx) => controller.replayClosure(req.params!.id, ctx),
  );

  // GET /operations/closure/audit — W7 actor-scoped audit trail
  r.route(
    {
      method: 'get',
      path: '/operations/closure/audit',
      summary: '查询账户关闭审计记录（W7，最小权限）',
      responses: {
        200: successResponse(z.array(OperationAuditRecordSchema), '获取成功'),
      },
    },
    [...readAuth],
    (_req, ctx) => controller.getOperationAudit(ctx),
  );

  return router;
}
