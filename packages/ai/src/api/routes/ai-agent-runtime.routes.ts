/**
 * Residual 965: getRequestId sole import (packages/ai/src/shared/get-request-id.ts).
 */
import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  errorResponse,
  successResponse,
} from '@dailyuse/utils/result';
import {
  AgentEventSchema,
  AgentRunSchema,
  AgentRunStatusSchema,
  AgentResumePayloadSchema,
  AgentRunResultSchema,
  AgentStartRunClientRequestSchema,
} from '@dailyuse/contracts/ai';
import type { AIAgentRuntimeController } from '../../server/transport/ai-agent-runtime.controller';
import { getRequestId } from '../../shared/get-request-id';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIAgentRuntimeRoutes(
  controller: AIAgentRuntimeController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/agents',
    defaultTags: ['AI Agent'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'post',
      path: '/runs',
      summary: '启动 Agent 运行',
      request: {
        body: { content: { 'application/json': { schema: AgentStartRunClientRequestSchema } } },
      },
      responses: {
        201: successResponse(AgentRunResultSchema, '启动成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.startRun(
        req.body,
        { identityId: ctx.identityId } as ExecutionContext,
        getRequestId(req),
      ),
    { successStatus: 201 },
  );

  r.route(
    {
      method: 'get',
      path: '/runs',
      summary: '列出 Agent 运行',
      request: {
        query: z.object({
          conversationId: z.string().optional(),
          status: z.union([AgentRunStatusSchema, z.array(AgentRunStatusSchema)]).optional(),
          activeOnly: z.string().optional(),
          limit: z.string().optional(),
        }),
      },
      responses: {
        200: successResponse(z.array(AgentRunSchema), '获取成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.listRuns(
        req.query,
        { identityId: ctx.identityId } as ExecutionContext,
        getRequestId(req),
      ),
  );

  r.route(
    {
      method: 'post',
      path: '/runs/:runId/resume',
      summary: '恢复 Agent 运行',
      request: {
        params: z.object({ runId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: AgentResumePayloadSchema } } },
      },
      responses: {
        200: successResponse(AgentRunResultSchema, '恢复成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.resumeRun(
        req.params?.runId ?? '',
        req.body,
        { identityId: ctx.identityId } as ExecutionContext,
        getRequestId(req),
      ),
  );

  r.route(
    {
      method: 'get',
      path: '/runs/:runId',
      summary: '获取 Agent 运行状态',
      request: {
        params: z.object({ runId: z.string().min(1) }),
      },
      responses: {
        200: successResponse(AgentRunResultSchema, '获取成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getRun(
        req.params?.runId ?? '',
        { identityId: ctx.identityId } as ExecutionContext,
        getRequestId(req),
      ),
  );

  r.route(
    {
      method: 'get',
      path: '/runs/:runId/events',
      summary: '获取 Agent 运行事件',
      request: {
        params: z.object({ runId: z.string().min(1) }),
      },
      responses: {
        200: successResponse(z.array(AgentEventSchema), '获取成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) =>
      controller.getEvents(
        req.params?.runId ?? '',
        { identityId: ctx.identityId } as ExecutionContext,
        getRequestId(req),
      ),
  );

  return router;
}
