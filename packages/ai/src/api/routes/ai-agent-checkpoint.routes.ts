import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  errorResponse,
  successResponse,
  ok,
  fail,
} from '@dailyuse/utils/result';
import { AgentRunSchema, AgentStateSchema, AgentRunResultSchema, AgentEventSchema } from '@dailyuse/contracts/ai';
import type { AIAgentCheckpointController } from '../../controllers/ai-agent-checkpoint.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

function getRequestId(req: { traceId?: string; id?: string }): string | undefined {
  return req.traceId ?? req.id;
}

export function registerAIAgentCheckpointRoutes(
  controller: AIAgentCheckpointController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/internal/agents/checkpoints',
    defaultTags: ['AI Agent Checkpoint'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  const UpsertCheckpointBodySchema = z.object({
    run: AgentRunSchema,
    state: AgentStateSchema.optional(),
    threadId: z.string().optional(),
    events: z.array(AgentEventSchema).optional(),
    interrupts: z.array(z.record(z.string(), z.unknown())).optional(),
  });

  const ListCheckpointsQuerySchema = z.object({
    agentType: z.string().optional(),
    conversationId: z.string().optional(),
    status: z.array(z.string()).optional(),
    activeOnly: z.string().optional(),
    limit: z.string().optional(),
  });

  r.route(
    {
      method: 'post',
      path: '/',
      summary: 'Upsert Agent checkpoint',
      request: {
        body: { content: { 'application/json': { schema: UpsertCheckpointBodySchema } } },
      },
      responses: {
        204: { description: 'Checkpoint upserted successfully' },
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    async (req, ctx) => {
      const body = req.body as z.infer<typeof UpsertCheckpointBodySchema>;
      await controller.upsertCheckpoint({
        identityId: ctx.identityId,
        run: body.run,
        state: body.state,
        threadId: body.threadId,
        events: body.events,
        interrupts: body.interrupts,
        requestId: getRequestId(req),
      });
      return ok(undefined);
    },
    { successStatus: 204 },
  );

  r.route(
    {
      method: 'get',
      path: '/:runId',
      summary: 'Get Agent checkpoint',
      request: {
        params: z.object({ runId: z.string() }),
      },
      responses: {
        200: successResponse(AgentRunResultSchema, 'Checkpoint retrieved'),
        404: errorResponse('Checkpoint not found'),
      },
    },
    [auth],
    async (req, ctx) => {
      const params = req.params as { runId: string };
      const result = await controller.getCheckpoint({
        identityId: ctx.identityId,
        runId: params.runId,
        requestId: getRequestId(req),
      });

      if (!result) {
        return fail({ code: 'NOT_FOUND', message: 'Checkpoint not found' });
      }

      return ok(result);
    },
  );

  r.route(
    {
      method: 'get',
      path: '/',
      summary: 'List Agent checkpoints',
      request: {
        query: ListCheckpointsQuerySchema,
      },
      responses: {
        200: successResponse(z.array(AgentRunSchema), 'Checkpoints retrieved'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    async (req, ctx) => {
      const query = req.query as z.infer<typeof ListCheckpointsQuerySchema>;
      const statuses = query.status;
      const activeOnly = query.activeOnly === 'true';
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;

      const runs = await controller.listCheckpoints({
        identityId: ctx.identityId,
        agentType: query.agentType,
        conversationId: query.conversationId,
        statuses,
        activeOnly,
        limit,
        requestId: getRequestId(req),
      });

      return ok(runs);
    },
  );

  r.route(
    {
      method: 'delete',
      path: '/:runId',
      summary: 'Delete Agent checkpoint',
      request: {
        params: z.object({ runId: z.string() }),
      },
      responses: {
        204: { description: 'Checkpoint deleted successfully' },
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    async (req, ctx) => {
      const params = req.params as { runId: string };
      await controller.deleteCheckpoint({
        identityId: ctx.identityId,
        runId: params.runId,
        requestId: getRequestId(req),
      });
      return ok(undefined);
    },
    { successStatus: 204 },
  );

  r.route(
    {
      method: 'get',
      path: '/thread-index',
      summary: 'Get Agent thread index',
      responses: {
        200: successResponse(z.record(z.string(), z.string()), 'Thread index retrieved'),
      },
    },
    [auth],
    async (req, ctx) => {
      const query = req.query as { agentType?: string };
      const index = await controller.getThreadIndex(ctx.identityId, query.agentType);
      return ok(index);
    },
  );

  return router;
}
