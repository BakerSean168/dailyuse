/**
 * AI API Module Definition
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { AIModule } from '../infrastructure-server/ai.module';
import { RepositoryModule } from '@dailyuse/repository';
import { FsStorageAdapter } from '@dailyuse/repository';
import { SettingModule } from '@dailyuse/setting';
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
import { DefaultRepositoryResolver } from '../infrastructure-server/services/default-repository-resolver';
import { AIKnowledgeNotePathResolver } from '../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { RepositoryResourceWriter } from '../infrastructure-server/services/repository-resource-writer';
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

export const AIApiModule: AIApiModuleDef = {
  name: 'AI',

  register(context) {
    const { router, middleware, db } = context;

    const aiModule = new AIModule('prisma', db as PrismaClient);
    const repositoryModule = new RepositoryModule('prisma', db as PrismaClient);
    const settingModule = new SettingModule('prisma', db as PrismaClient);
    const storageBaseDir =
      process.env.REPOSITORY_STORAGE_PATH || '/tmp/dailyuse-repository-storage';
    const storagePort = new FsStorageAdapter(storageBaseDir);
    const knowledgeNoteService = new AIKnowledgeNoteService(
      aiModule.providerConfigRepository,
      new OpenAICompatibleGateway(),
      new DefaultRepositoryResolver(repositoryModule.repositoryRepository),
      new RepositoryResourceWriter(
        repositoryModule.resourceRepository,
        repositoryModule.repositoryRepository,
        storagePort,
      ),
      async (identityId: string) => {
        const setting = await settingModule.getUserSetting.execute(identityId);
        return setting.preferences.ai.knowledgeNoteSubpath;
      },
      new AIKnowledgeNotePathResolver(),
    );

    const goalController = new AIGoalGenerationController(aiModule.goalGenerationService);
    const providerController = new AIProviderConfigController(aiModule.providerConfigService);
    const chatController = new AIChatController(aiModule.conversationService, aiModule.chatService);
    const knowledgeNoteController = new AIKnowledgeNoteController(knowledgeNoteService);

    const goalRoutes = registerAIGoalGenerationRoutes(
      goalController,
      middleware,
      context.openApiRegistry,
    );
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
