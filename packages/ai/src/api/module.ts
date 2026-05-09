/**
 * AI API Module Definition
 * AI API 模块定义
 *
 * 实现 IApiModule 标准接口，内部自治完成：
 * 1. Composition Root（创建 Repo → UseCase → Service → Handler）
 * 2. 路由定义与挂载
 * 3. 初始化任务注册
 *
 * 中间件来自 context.middleware，不依赖 apps/api 内部实现。
 *
 * Follows the governance reference pattern:
 * 1. Composition Root via `createAIModule(deps)`
 * 2. Transport handlers via `createAITransportHandlers(api)`
 * 3. Route registration
 * + `destroy()` for cleanup
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  AIExecutionLogPrismaAdapter,
  AIEvaluationReportFileAdapter,
  AIKnowledgeIndexPrismaRepository,
  AIServiceAnalyticsQueryAdapter,
  AIServiceGoalAutomationAdapter,
  createAIModule,
  AIConversationPrismaRepository,
  AIProviderConfigPrismaRepository,
  type AIModuleInstance,
  AIServiceChatExecutionAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeQueryAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
} from '../infrastructure-server';
import {
  registerAICapabilitiesRoutes,
  registerAIAnalyticsQueryRoutes,
  registerAIEvaluationReportRoutes,
  registerAIGoalGenerationRoutes,
  registerAIProviderRoutes,
  registerAIChatRoutes,
  registerAIKnowledgeQueryRoutes,
  registerAIKnowledgeNoteRoutes,
} from './routes';
import { AICapabilitiesController } from '../controllers/ai-capabilities.controller';
import { AIAnalyticsQueryController } from '../controllers/ai-analytics-query.controller';
import { AIEvaluationReportController } from '../controllers/ai-evaluation-report.controller';
import { AIGoalGenerationController } from '../controllers/ai-goal-generation.controller';
import { AIProviderConfigController } from '../controllers/ai-provider-config.controller';
import { AIChatController } from '../controllers/ai-chat.controller';
import { AIKnowledgeQueryController } from '../controllers/ai-knowledge-query.controller';
import { AIKnowledgeNoteController } from '../controllers/ai-knowledge-note.controller';
import type {
  IAnalyticsReadPort,
  IAIAutomationToolExecutorPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
} from '../application-server';
import { createAITransportHandlers } from './transport-handlers';
import { getAIServiceRuntimeConfig } from '../shared/config/env';

/**
 * 模块注册上下文（与 apps/api 的 IApiModuleContext 对齐）
 *
 * 此类型在 AI 包内本地定义，避免对 apps/api 的循环依赖。
 * 只要字段签名一致，TypeScript 结构类型系统会自动兼容。
 */
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

let activeAIModule: AIModuleInstance | null = null;

/**
 * Factory that creates an AI API module definition.
 * 创建 AI API 模块定义的工厂函数。
 *
 * External collaborators (knowledge-note persistence, subpath resolver) are
 * injected here because they come from the host application, not from the AI
 * module's own domain. This mirrors how the governance module receives its
 * runtime contributions.
 *
 * 外部协作者（知识笔记持久化、子路径解析器）在此注入，因为它们
 * 来自宿主应用，而非 AI 模块自身的领域。这与 governance 模块
 * 接收运行时贡献的方式一致。
 */
export function createAIApiModule(options: {
  createKnowledgeNotePersistence(context: AIApiModuleContext): IKnowledgeNotePersistencePort;
  createKnowledgeSourcePort(context: AIApiModuleContext): IKnowledgeSourcePort;
  createAnalyticsReadPort(context: AIApiModuleContext): IAnalyticsReadPort;
  createAutomationToolExecutor(context: AIApiModuleContext): IAIAutomationToolExecutorPort;
  getKnowledgeNoteSubpath(identityId: string, context: AIApiModuleContext): Promise<string>;
}): AIApiModuleDef {
  return {
    name: 'AI',

    register(context) {
      const { router, middleware, db } = context;

      // ---------------------------------------------------------------
      // 1. Composition Root — 组装依赖（使用共享数据库单例）
      //    The application edge decides which adapter implementation to use.
      //    模块内部只关心端口，不关心数据源来自 Prisma 还是其他实现。
      // ---------------------------------------------------------------
      const prismaClient = db as PrismaClient;
      const aiServiceRuntimeConfig = getAIServiceRuntimeConfig();
      const aiModule = createAIModule({
        conversationRepository: new AIConversationPrismaRepository(prismaClient),
        providerConfigRepository: new AIProviderConfigPrismaRepository(prismaClient),
        chatExecutionPort: aiServiceRuntimeConfig
          ? new AIServiceChatExecutionAdapter(aiServiceRuntimeConfig)
          : undefined,
        goalPlanningPort: aiServiceRuntimeConfig
          ? new AIServiceGoalPlanningAdapter(aiServiceRuntimeConfig)
          : undefined,
        goalAutomationPlanningPort: aiServiceRuntimeConfig
          ? new AIServiceGoalAutomationAdapter(aiServiceRuntimeConfig)
          : undefined,
        automationToolExecutorPort: options.createAutomationToolExecutor(context),
        knowledgeIndexRepository: new AIKnowledgeIndexPrismaRepository(prismaClient),
        knowledgeIngestionPort: aiServiceRuntimeConfig
          ? new AIServiceKnowledgeIngestionAdapter(aiServiceRuntimeConfig)
          : undefined,
        knowledgeQueryPort: aiServiceRuntimeConfig
          ? new AIServiceKnowledgeQueryAdapter(aiServiceRuntimeConfig)
          : undefined,
        knowledgeNoteGenerationPort: aiServiceRuntimeConfig
          ? new AIServiceKnowledgeNoteGenerationAdapter(aiServiceRuntimeConfig)
          : undefined,
        analyticsQueryPort: aiServiceRuntimeConfig
          ? new AIServiceAnalyticsQueryAdapter(aiServiceRuntimeConfig)
          : undefined,
        executionLogPort: new AIExecutionLogPrismaAdapter(prismaClient),
        evaluationReportPort: new AIEvaluationReportFileAdapter(),
        knowledgeNotePersistence: options.createKnowledgeNotePersistence(context),
        knowledgeSourcePort: options.createKnowledgeSourcePort(context),
        analyticsReadPort: options.createAnalyticsReadPort(context),
        getKnowledgeNoteSubpath: (identityId: string) =>
          options.getKnowledgeNoteSubpath(identityId, context),
      });
      activeAIModule = aiModule;
      aiModule.start();
      const handlers = createAITransportHandlers(aiModule.api);

      // ---------------------------------------------------------------
      // 2. Controllers — wired to the module's ApplicationPort (api)
      //    控制器 — 通过模块的 ApplicationPort (api) 门面接线
      //
      //    All controller wiring goes through `aiModule.api.*` to maintain
      //    a single transport-facing surface. This ensures business rules
      //    enforced in the api facade are never accidentally bypassed.
      //
      //    所有控制器接线都通过 `aiModule.api.*` 以维护单一的传输层门面。
      //    这确保 api 门面中的业务规则不会被意外绕过。
      // ---------------------------------------------------------------
      const goalController = new AIGoalGenerationController({
        generateGoal: handlers.generateGoal,
      });
      const capabilitiesController = new AICapabilitiesController({
        getCapabilities: handlers.getCapabilities,
      });
      const providerController = new AIProviderConfigController({
        createProvider: handlers.createProvider,
        updateProvider: handlers.updateProvider,
        listProviders: handlers.listProviders,
        getProvider: handlers.getProvider,
        deleteProvider: handlers.deleteProvider,
        testConnection: handlers.testConnection,
        setDefaultProvider: handlers.setDefaultProvider,
        refreshProviderModels: handlers.refreshProviderModels,
      });
      const chatController = new AIChatController(
        {
          createConversation: handlers.createConversation,
          listConversations: handlers.listConversations,
          getConversation: handlers.getConversation,
          updateConversation: handlers.updateConversation,
          deleteConversation: handlers.deleteConversation,
        },
        {
          sendMessage: handlers.sendMessage,
          streamMessage: handlers.streamMessage,
        },
      );

      // Routes always register — unavailable capabilities return SERVICE_UNAVAILABLE
      // from the runtime service surface.
      // 路由始终注册 — 不可用的能力由运行时服务层返回 SERVICE_UNAVAILABLE。
      const knowledgeNoteController = new AIKnowledgeNoteController({
        createKnowledgeNote: handlers.createKnowledgeNote,
      });
      const knowledgeQueryController = new AIKnowledgeQueryController({
        expandKnowledge: handlers.expandKnowledge,
        queryKnowledge: handlers.queryKnowledge,
        reindexKnowledge: handlers.reindexKnowledge,
      });
      const analyticsQueryController = new AIAnalyticsQueryController({
        queryAnalytics: handlers.queryAnalytics,
      });
      const evaluationReportController = new AIEvaluationReportController({
        getEvaluationOverview: handlers.getEvaluationOverview,
      });

      // ---------------------------------------------------------------
      // 3. 创建路由（注入平台中间件）并挂载到主路由
      //    Create routes (inject platform middleware) and mount them.
      // ---------------------------------------------------------------
      const goalRoutes = registerAIGoalGenerationRoutes(goalController, middleware);
      const capabilityRoutes = registerAICapabilitiesRoutes(
        capabilitiesController,
        middleware,
        context.openApiRegistry,
      );
      const providerRoutes = registerAIProviderRoutes(
        providerController,
        middleware,
        context.openApiRegistry,
      );
      const chatRoutes = registerAIChatRoutes(chatController, middleware, context.openApiRegistry);
      const knowledgeQueryRoutes = registerAIKnowledgeQueryRoutes(
        knowledgeQueryController,
        middleware,
        context.openApiRegistry,
      );
      const knowledgeNoteRoutes = registerAIKnowledgeNoteRoutes(
        knowledgeNoteController,
        middleware,
        context.openApiRegistry,
      );
      const analyticsQueryRoutes = registerAIAnalyticsQueryRoutes(
        analyticsQueryController,
        middleware,
        context.openApiRegistry,
      );
      const evaluationReportRoutes = registerAIEvaluationReportRoutes(
        evaluationReportController,
        middleware,
        context.openApiRegistry,
      );

      // 挂载到主路由（模块自决前缀）
      router.use('/ai/providers', providerRoutes);
      router.use('/ai', capabilityRoutes);
      router.use('/ai/chat', chatRoutes);
      router.use('/ai/knowledge', knowledgeQueryRoutes);
      router.use('/ai/knowledge-notes', knowledgeNoteRoutes);
      router.use('/ai/analytics', analyticsQueryRoutes);
      router.use('/ai', evaluationReportRoutes);
      router.use('/ai/generate', goalRoutes);
    },

    destroy() {
      activeAIModule?.dispose();
      activeAIModule = null;
    },
  };
}
