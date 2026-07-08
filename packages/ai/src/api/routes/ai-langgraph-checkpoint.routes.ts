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
import type { AILangGraphCheckpointController } from '../../server/transport/ai-langgraph-checkpoint.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

function getRequestId(req: { traceId?: string; id?: string }): string | undefined {
  return req.traceId ?? req.id;
}

const SerializedLangGraphValueSchema = z.object({
  type: z.string().min(1),
  data: z.string().min(1),
});

const LangGraphCheckpointWriteSchema = z.object({
  idx: z.number().int(),
  channel: z.string().min(1),
  value: SerializedLangGraphValueSchema,
});

const LangGraphCheckpointTupleRecordSchema = z.object({
  identityId: z.string(),
  agentType: z.string(),
  threadId: z.string(),
  checkpointNs: z.string(),
  checkpointId: z.string(),
  parentCheckpointId: z.string().nullable().optional(),
  checkpoint: SerializedLangGraphValueSchema,
  metadata: SerializedLangGraphValueSchema,
  createdAt: z.string(),
  pendingWrites: z.array(
    z.object({
      taskId: z.string(),
      taskPath: z.string(),
      idx: z.number().int(),
      channel: z.string(),
      value: SerializedLangGraphValueSchema,
      createdAt: z.string(),
    }),
  ),
});

export function registerAILangGraphCheckpointRoutes(
  controller: AILangGraphCheckpointController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/internal/agents/langgraph-checkpoints',
    defaultTags: ['AI LangGraph Checkpoint'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  const PutCheckpointBodySchema = z.object({
    agentType: z.string().min(1),
    threadId: z.string().min(1),
    checkpointNs: z.string().optional(),
    checkpointId: z.string().min(1),
    parentCheckpointId: z.string().nullable().optional(),
    checkpoint: SerializedLangGraphValueSchema,
    metadata: SerializedLangGraphValueSchema,
  });

  const PutWritesBodySchema = z.object({
    agentType: z.string().min(1),
    threadId: z.string().min(1),
    checkpointNs: z.string().optional(),
    checkpointId: z.string().min(1),
    taskId: z.string().min(1),
    taskPath: z.string().optional(),
    writes: z.array(LangGraphCheckpointWriteSchema),
  });

  const GetCheckpointQuerySchema = z.object({
    agentType: z.string().min(1),
    threadId: z.string().min(1),
    checkpointNs: z.string().optional(),
    checkpointId: z.string().optional(),
  });

  const ListCheckpointsQuerySchema = z.object({
    agentType: z.string().min(1),
    threadId: z.string().min(1),
    checkpointNs: z.string().optional(),
    beforeCheckpointId: z.string().optional(),
    limit: z.string().optional(),
  });

  const DeleteThreadQuerySchema = z.object({
    agentType: z.string().min(1),
    threadId: z.string().min(1),
    checkpointNs: z.string().optional(),
  });

  r.route(
    {
      method: 'post',
      path: '/',
      summary: 'Upsert LangGraph checkpoint',
      request: {
        body: { content: { 'application/json': { schema: PutCheckpointBodySchema } } },
      },
      responses: {
        204: { description: 'Checkpoint persisted successfully' },
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    async (req, ctx) => {
      const body = req.body as z.infer<typeof PutCheckpointBodySchema>;
      await controller.putCheckpoint({
        identityId: ctx.identityId,
        agentType: body.agentType,
        threadId: body.threadId,
        checkpointNs: body.checkpointNs,
        checkpointId: body.checkpointId,
        parentCheckpointId: body.parentCheckpointId,
        checkpoint: body.checkpoint,
        metadata: body.metadata,
        requestId: getRequestId(req),
      });
      return ok(undefined);
    },
    { successStatus: 204 },
  );

  r.route(
    {
      method: 'post',
      path: '/writes',
      summary: 'Persist LangGraph checkpoint writes',
      request: {
        body: { content: { 'application/json': { schema: PutWritesBodySchema } } },
      },
      responses: {
        204: { description: 'Checkpoint writes persisted successfully' },
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    async (req, ctx) => {
      const body = req.body as z.infer<typeof PutWritesBodySchema>;
      await controller.putWrites({
        identityId: ctx.identityId,
        agentType: body.agentType,
        threadId: body.threadId,
        checkpointNs: body.checkpointNs,
        checkpointId: body.checkpointId,
        taskId: body.taskId,
        taskPath: body.taskPath,
        writes: body.writes,
        requestId: getRequestId(req),
      });
      return ok(undefined);
    },
    { successStatus: 204 },
  );

  r.route(
    {
      method: 'get',
      path: '/head',
      summary: 'Get LangGraph checkpoint head or exact checkpoint',
      request: {
        query: GetCheckpointQuerySchema,
      },
      responses: {
        200: successResponse(LangGraphCheckpointTupleRecordSchema, 'Checkpoint retrieved'),
        404: errorResponse('Checkpoint not found'),
      },
    },
    [auth],
    async (req, ctx) => {
      const query = req.query as z.infer<typeof GetCheckpointQuerySchema>;
      const result = await controller.getCheckpoint({
        identityId: ctx.identityId,
        agentType: query.agentType,
        threadId: query.threadId,
        checkpointNs: query.checkpointNs,
        checkpointId: query.checkpointId,
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
      summary: 'List LangGraph checkpoints',
      request: {
        query: ListCheckpointsQuerySchema,
      },
      responses: {
        200: successResponse(z.array(LangGraphCheckpointTupleRecordSchema), 'Checkpoints retrieved'),
      },
    },
    [auth],
    async (req, ctx) => {
      const query = req.query as z.infer<typeof ListCheckpointsQuerySchema>;
      const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
      const result = await controller.listCheckpoints({
        identityId: ctx.identityId,
        agentType: query.agentType,
        threadId: query.threadId,
        checkpointNs: query.checkpointNs,
        beforeCheckpointId: query.beforeCheckpointId,
        limit,
        requestId: getRequestId(req),
      });
      return ok(result);
    },
  );

  r.route(
    {
      method: 'delete',
      path: '/thread',
      summary: 'Delete LangGraph checkpoint thread',
      request: {
        query: DeleteThreadQuerySchema,
      },
      responses: {
        204: { description: 'Checkpoint thread deleted successfully' },
      },
    },
    [auth],
    async (req, ctx) => {
      const query = req.query as z.infer<typeof DeleteThreadQuerySchema>;
      await controller.deleteThread({
        identityId: ctx.identityId,
        agentType: query.agentType,
        threadId: query.threadId,
        checkpointNs: query.checkpointNs,
        requestId: getRequestId(req),
      });
      return ok(undefined);
    },
    { successStatus: 204 },
  );

  return router;
}
