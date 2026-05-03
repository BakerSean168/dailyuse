import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import { CreateKnowledgeNoteSchema } from '@dailyuse/contracts/ai';
import type { AIKnowledgeNoteController } from '../../controllers/ai-knowledge-note.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIKnowledgeNoteRoutes(
  controller: AIKnowledgeNoteController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/knowledge-notes',
    defaultTags: ['AI Knowledge Note'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  // POST / — Create knowledge note
  r.route(
    {
      method: 'post',
      path: '/',
      summary: '创建知识笔记',
      request: { body: { content: { 'application/json': { schema: CreateKnowledgeNoteSchema } } } },
      responses: {
        201: successResponse(z.any(), '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, { identityId: ctx.identityId } as ExecutionContext),
    { successStatus: 201 },
  );

  return router;
}
