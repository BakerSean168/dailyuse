import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  CreateAIProviderConfigSchema,
  UpdateAIProviderConfigSchema,
  TestAIProviderSchema,
} from '@dailyuse/contracts/ai';
import type { AIProviderConfigController } from '../../controllers/ai-provider-config.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIProviderRoutes(
  controller: AIProviderConfigController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/providers',
    defaultTags: ['AI Provider'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create provider
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建 AI 提供商配置',
      request: {
        body: { content: { 'application/json': { schema: CreateAIProviderConfigSchema } } },
      },
      responses: {
        201: successResponse(z.any(), '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, { identityId: ctx.identityId } as ExecutionContext),
    { successStatus: 201 },
  );

  // GET / — List providers
  r.route(
    {
      method: 'get',
      path: '/',
      summary: '获取 AI 提供商配置列表',
      responses: {
        200: successResponse(z.any(), '获取成功'),
      },
    },
    [auth],
    (_req, ctx) => controller.list({ identityId: ctx.identityId } as ExecutionContext),
  );

  // GET /:id — Get provider
  r.route(
    {
      method: 'get',
      path: '/:id',
      summary: '获取 AI 提供商配置',
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.any(), '获取成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.get(req.params!.id),
  );

  // PATCH /:id — Update provider
  r.route(
    {
      method: 'patch',
      path: '/:id',
      summary: '更新 AI 提供商配置',
      request: {
        params: z.object({ id: z.string() }),
        body: { content: { 'application/json': { schema: UpdateAIProviderConfigSchema } } },
      },
      responses: {
        200: successResponse(z.any(), '更新成功'),
        400: errorResponse('参数错误'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.update(req.params!.id, req.body),
  );

  // DELETE /:id — Delete provider
  r.route(
    {
      method: 'delete',
      path: '/:id',
      summary: '删除 AI 提供商配置',
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.object({}), '删除成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req) => controller.delete(req.params!.id),
  );

  // POST /test — Test provider connection
  r.route(
    {
      method: 'post',
      path: '/test',
      summary: '测试 AI 提供商连接',
      request: { body: { content: { 'application/json': { schema: TestAIProviderSchema } } } },
      responses: {
        200: successResponse(z.any(), '测试成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.test(req.body, { identityId: ctx.identityId } as ExecutionContext),
  );

  // POST /:id/set-default — Set default provider
  r.route(
    {
      method: 'post',
      path: '/:id/set-default',
      summary: '设置默认 AI 提供商',
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.object({}), '设置成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req, ctx) => controller.setDefault(req.params!.id, { identityId: ctx.identityId } as ExecutionContext),
  );

  // POST /:id/refresh-models — Refresh provider models
  r.route(
    {
      method: 'post',
      path: '/:id/refresh-models',
      summary: '刷新 AI 提供商模型列表',
      request: {
        params: z.object({ id: z.string() }),
      },
      responses: {
        200: successResponse(z.any(), '刷新成功'),
        404: errorResponse('未找到'),
      },
    },
    [auth],
    (req, ctx) => controller.refreshModels(req.params!.id, { identityId: ctx.identityId } as ExecutionContext),
  );

  return router;
}
