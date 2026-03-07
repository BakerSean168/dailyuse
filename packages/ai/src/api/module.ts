/**
 * AI API Module Definition
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { AIModule } from '../infrastructure-server/ai.module';
import { AIGoalGenerationController } from './controllers/ai-goal-generation.controller';
import { registerAIGoalGenerationRoutes } from './routes';

export interface AIApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface AIApiModuleDef {
  readonly name: string;
  register(context: AIApiModuleContext): void;
  destroy?(): void;
}

export const AIApiModule: AIApiModuleDef = {
  name: 'AI',

  register(context) {
    const { router, middleware, db } = context;

    const aiModule = new AIModule('prisma', db as PrismaClient);

    const goalController = new AIGoalGenerationController(aiModule.goalGenerationService);

    const goalRoutes = registerAIGoalGenerationRoutes(
      goalController,
      middleware,
      context.openApiRegistry,
    );
    router.use('/ai/generate', goalRoutes);
  },
};
