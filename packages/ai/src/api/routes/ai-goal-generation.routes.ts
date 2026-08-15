/**
 * AI Goal Generation Routes
 */

import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@memoflow/utils/result';
import { GenerateGoalsSchema, GoalWorkflowResultDTOSchema } from '@memoflow/contracts/ai';
import type { AIGoalGenerationController } from '../../server/transport/ai-goal-generation.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIGoalGenerationRoutes(
  controller: AIGoalGenerationController,
  middleware: PlatformMiddleware,
  openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  const r = new RouteRegistrar(router, openApiRegistry ?? null, {
    basePath: '/api/v1/ai/generate',
    defaultTags: ['AI'],
    defaultSecurity: [{ bearerAuth: [] }],
  });

  r.route(
    {
      method: 'post',
      path: '/goal',
      summary: '生成目标',
      request: { body: { content: { 'application/json': { schema: GenerateGoalsSchema } } } },
      responses: {
        200: successResponse(GoalWorkflowResultDTOSchema, '生成成功'),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.generateGoal(req.body, ctx),
  );

  return router;
}
