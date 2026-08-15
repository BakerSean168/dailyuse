import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@memoflow/utils/result';
import { CreateKnowledgeNoteSchema, CreateKnowledgeNoteResSchema } from '@memoflow/contracts/ai';
import type { AIKnowledgeNoteController } from '../../server/transport/ai-knowledge-note.controller';

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
        201: successResponse(CreateKnowledgeNoteResSchema, '创建成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.create(req.body, ctx),
    { successStatus: 201 },
  );

  return router;
}
