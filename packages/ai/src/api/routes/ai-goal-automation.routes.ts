import { z } from 'zod';
import { Router, type RequestHandler } from 'express';
import {
  RouteRegistrar,
  type OpenApiRegistryLike,
  successResponse,
  errorResponse,
} from '@dailyuse/utils/result';
import {
  GenerateGoalAutomationSchema,
  GoalAutomationActionSchema,
  GoalAutomationExecutedActionSchema,
} from '@dailyuse/contracts/ai';
import type { AIGoalAutomationController } from '../controllers/ai-goal-automation.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

export function registerAIGoalAutomationRoutes(
  controller: AIGoalAutomationController,
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
      path: '/goal-automation',
      summary: '规划并执行目标自动化',
      request: {
        body: {
          content: {
            'application/json': {
              schema: GenerateGoalAutomationSchema,
            },
          },
        },
      },
      responses: {
        200: successResponse(
          z.object({
            summary: z.string(),
            requiresConfirmation: z.boolean(),
            plan: z.object({
              goal: z.any(),
              keyResults: z.array(z.any()).optional(),
              taskTemplates: z.array(z.any()).optional(),
            }),
            actions: z.array(GoalAutomationActionSchema),
            executedActions: z.array(GoalAutomationExecutedActionSchema).optional(),
            providerId: z.string(),
            tokenUsage: z.object({
              promptTokens: z.number().int().nonnegative(),
              completionTokens: z.number().int().nonnegative(),
              totalTokens: z.number().int().nonnegative(),
            }),
            processingTimeMs: z.number().int().nonnegative(),
          }),
          '执行成功',
        ),
        400: errorResponse('参数错误'),
      },
    },
    [auth],
    (req, ctx) => controller.automateGoal(req.body, ctx.identityId),
  );

  return router;
}
