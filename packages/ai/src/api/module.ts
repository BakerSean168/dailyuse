/**
 * AI API Module Definition
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { AIModule } from '../infrastructure-server/ai.module';
import { AIGoalGenerationController } from './controllers/ai-goal-generation.controller';
import { AIProviderConfigController } from './controllers/ai-provider-config.controller';
import { AIChatController } from './controllers/ai-chat.controller';
import { AIKnowledgeNoteController } from './controllers/ai-knowledge-note.controller';
import {
  registerAIGoalGenerationRoutes,
  registerAIProviderRoutes,
  registerAIChatRoutes,
  registerAIKnowledgeNoteRoutes,
} from './routes';
import { OpenAICompatibleGateway } from '../infrastructure-server/gateways/openai-compatible.gateway';
import { AIKnowledgeNotePathResolver } from '../infrastructure-server/services/ai-knowledge-note-path-resolver';
import type { IKnowledgeNotePersistencePort } from '../application-server';
import { AIKnowledgeNoteService } from '../application-server/use-cases/commands/ai-knowledge-note.service';

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

export function createAIApiModule(options: {
  createKnowledgeNotePersistence(context: AIApiModuleContext): IKnowledgeNotePersistencePort;
  getKnowledgeNoteSubpath(identityId: string, context: AIApiModuleContext): Promise<string>;
}): AIApiModuleDef {
  return {
    name: 'AI',

    register(context) {
      const { router, middleware, db } = context;

      const aiModule = new AIModule('prisma', db as PrismaClient);
      const knowledgeNoteService = new AIKnowledgeNoteService(
        aiModule.providerConfigRepository,
        new OpenAICompatibleGateway(),
        options.createKnowledgeNotePersistence(context),
        (identityId: string) => options.getKnowledgeNoteSubpath(identityId, context),
        new AIKnowledgeNotePathResolver(),
      );

      const goalController = new AIGoalGenerationController(aiModule.goalGenerationService);
      const providerController = new AIProviderConfigController(aiModule.providerConfigService);
      const chatController = new AIChatController(
        aiModule.conversationService,
        aiModule.chatService,
      );
      const knowledgeNoteController = new AIKnowledgeNoteController(knowledgeNoteService);

      const goalRoutes = registerAIGoalGenerationRoutes(goalController, middleware);
      const providerRoutes = registerAIProviderRoutes(
        providerController,
        middleware,
        context.openApiRegistry,
      );
      const chatRoutes = registerAIChatRoutes(chatController, middleware, context.openApiRegistry);
      const knowledgeNoteRoutes = registerAIKnowledgeNoteRoutes(
        knowledgeNoteController,
        middleware,
        context.openApiRegistry,
      );

      router.use('/ai/providers', providerRoutes);
      router.use('/ai/chat', chatRoutes);
      router.use('/ai/knowledge-notes', knowledgeNoteRoutes);
      router.use('/ai/generate', goalRoutes);
    },
  };
}
