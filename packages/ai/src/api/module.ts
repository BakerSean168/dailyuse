/**
 * AI API Module Definition — transport-only seam.
 * AI API 模块定义 —— 纯传输层 seam。
 *
 * This factory is host-composed: `apps/api` owns every ingredient via
 * `apps/api/src/runtime/compose-ai.ts`, which selects the Prisma repositories,
 * builds the service runtime adapters, wires the host capability ports, and
 * hands an already-assembled `AIModuleInstance` to
 * `createAIApiModule({ instance })`. This file never reads the database from
 * the registration context, never reads environment configuration, and never
 * constructs repositories, service adapters, or a package-level active instance.
 *
 * 本工厂由宿主组合：`apps/api` 通过 `apps/api/src/runtime/compose-ai.ts` 拥有全部
 * 原料——选择 Prisma repository、构建服务 runtime adapter、接好宿主能力 port，并把
 * 已装配好的 `AIModuleInstance` 交给 `createAIApiModule({ instance })`。本文件不从
 * 注册 context 读取数据库、不读取环境配置，也不构造 repository、service adapter
 * 或包级全局实例。
 *
 * Registration and lifecycle follow the governance reference pattern:
 * 1. Controllers wired to `instance.api` (single ApplicationPort track),
 *    including both internal checkpoint controllers from the required
 *    `instance.api.checkpoints` surface.
 * 2. `instance.start()` once, then mount the twelve route groups in the exact
 *    current order; a partial route set is rolled back on any mount failure.
 * 3. `destroy()` for cleanup, idempotent and a no-op after `failed`.
 *
 * 注册与生命周期遵循 governance 参考模式：controllers 绑定 `instance.api`
 * （包括从必需的 `instance.api.checkpoints` surface 接线的两个内部 checkpoint
 * controller）、调用一次 `instance.start()` 后按当前完全相同的顺序挂载十二组路由
 * （任一挂载失败时回滚半套路由）、`destroy()` 清理（幂等且 `failed` 后为 no-op）。
 */

import type { ServerModuleHandle, ServerTransportModuleContext } from '@memoflow/contracts/shared';
import { createLogger } from '@memoflow/utils/logger';
import type { AIModuleInstance } from '../server/infrastructure';
import {
  registerAIAgentCheckpointRoutes,
  registerAILangGraphCheckpointRoutes,
  registerAIAgentRuntimeRoutes,
  registerAICapabilitiesRoutes,
  registerAIAnalyticsQueryRoutes,
  registerAIEvaluationReportRoutes,
  registerAIGoalGenerationRoutes,
  registerAIProviderRoutes,
  registerAIChatRoutes,
  registerAIKnowledgeQueryRoutes,
  registerAIKnowledgeNoteRoutes,
  registerAIAssistantRoutes,
} from './routes';
import { AICapabilitiesController } from '../server/transport/ai-capabilities.controller';
import { AIAgentCheckpointController } from '../server/transport/ai-agent-checkpoint.controller';
import { AILangGraphCheckpointController } from '../server/transport/ai-langgraph-checkpoint.controller';
import { AIAgentRuntimeController } from '../server/transport/ai-agent-runtime.controller';
import { AIAnalyticsQueryController } from '../server/transport/ai-analytics-query.controller';
import { AIEvaluationReportController } from '../server/transport/ai-evaluation-report.controller';
import { AIGoalGenerationController } from '../server/transport/ai-goal-generation.controller';
import { AIProviderConfigController } from '../server/transport/ai-provider-config.controller';
import { AIChatController } from '../server/transport/ai-chat.controller';
import { AIKnowledgeQueryController } from '../server/transport/ai-knowledge-query.controller';
import { AIKnowledgeNoteController } from '../server/transport/ai-knowledge-note.controller';
import { AIAssistantFacadeController } from '../server/transport/ai-assistant-facade.controller';

const logger = createLogger('AIApi');

/**
 * Transport-only context for AI registration — reuses the canonical
 * shared `ServerTransportModuleContext`. Deliberately carries no `db`, so
 * this seam can never become a second composition root.
 *
 * AI注册的传输专用上下文——复用规范的共享 `ServerTransportModuleContext`。
 * 刻意不包含 `db`，该 seam 绝不可能是第二个组合根。
 */
export type AIApiModuleContext = ServerTransportModuleContext;

/**
 * AI API module handle extending the shared lifecycle contract.
 * AI API 模块 handle，继承共享生命周期契约。
 */
export interface AIApiModuleDef extends ServerModuleHandle<AIApiModuleContext> {}

/**
 * Options carrying the already-assembled AI instance.
 * 携带已装配 AI 实例的选项。
 */
export interface AIApiModuleOptions {
  readonly instance: AIModuleInstance;
}

/**
 * Per-handle lifecycle state. Only 'created' may enter 'registered' (or
 * 'failed' on a registration error); any state may end in 'disposed'.
 *
 * 每个 handle 的生命周期状态。只有 'created' 可以进入 'registered'
 * （或注册失败时进入 'failed'）；任意状态都可以结束于 'disposed'。
 */
type ModuleHandleState = 'created' | 'registered' | 'disposed' | 'failed';

/**
 * Factory that creates an AI API module definition.
 * 创建 AI API 模块定义的工厂函数。
 *
 * The host (apps/api) is responsible for composition: it selects the Prisma
 * adapters, builds the service runtime adapters, and wires the host capability
 * ports before calling `createAIModule(...)`. This factory accepts only the
 * already-assembled instance, requires the internal checkpoint application
 * surface (`instance.api.checkpoints.agent` and `.langGraph`) fail-closed, and
 * then wires every controller — including both checkpoint controllers — from
 * `instance.api`.
 *
 * 宿主（apps/api）负责组合：选择 Prisma adapter、构建服务 runtime adapter、接好
 * 宿主能力 port，再调用 `createAIModule(...)`。本工厂只接收已装配的 instance，
 * fail-closed 校验内部 checkpoint application surface
 * （`instance.api.checkpoints.agent` 与 `.langGraph`），并从此 `instance.api`
 * 接线全部 controller（含两个 checkpoint controller）。
 *
 * @param options - Options carrying the assembled AI instance.
 * @returns An IApiModule-compatible handle bound to the instance.
 */
export function createAIApiModule(options: AIApiModuleOptions): AIApiModuleDef {
  if (!options?.instance) {
    throw new Error('[FAIL-CLOSED] createAIApiModule requires options.instance');
  }

  const handlers = options.instance.api;
  const checkpoints = handlers.checkpoints;
  if (!checkpoints?.agent || !checkpoints?.langGraph) {
    throw new Error(
      '[FAIL-CLOSED] createAIApiModule requires instance.api.checkpoints (agent + langGraph) ' +
        'to wire the internal checkpoint routes',
    );
  }

  let state: ModuleHandleState = 'created';

  return {
    name: 'AI',

    register(context) {
      if (state !== 'created') {
        throw new Error(
          `AIApiModule.register() called while in '${state}' state; a handle may only register once from 'created'`,
        );
      }

      const { router, middleware, openApiRegistry } = context;

      try {
        // ---------------------------------------------------------------
        // 1. Controllers — wired to the module's ApplicationPort (instance.api)
        //    控制器 — 通过模块的 ApplicationPort (instance.api) 门面接线
        //
        //    All controller wiring goes through `instance.api.*` to maintain
        //    a single transport-facing surface. This ensures business rules
        //    enforced in the api facade are never accidentally bypassed.
        //
        //    所有控制器接线都通过 `instance.api.*` 以维护单一的传输层门面。
        //    这确保 api 门面中的业务规则不会被意外绕过。
        // ---------------------------------------------------------------
        const goalController = new AIGoalGenerationController({
          generateGoal: handlers.generateGoal,
        });
        const capabilitiesController = new AICapabilitiesController({
          getCapabilities: handlers.getCapabilities,
        });
        const agentRuntimeController = new AIAgentRuntimeController({
          listAgentRuns: handlers.listAgentRuns,
          startAgentRun: handlers.startAgentRun,
          resumeAgentRun: handlers.resumeAgentRun,
          getAgentRun: handlers.getAgentRun,
          getAgentEvents: handlers.getAgentEvents,
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

        // Residual 345: AssistantFacade Host dispatch (identity from auth only).
        const assistantController = new AIAssistantFacadeController({
          dispatchAssistant: handlers.dispatchAssistant,
        });

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

        // Internal checkpoint controllers wired from the required checkpoint
        // application surface (never constructed from a database adapter here).
        // 内部 checkpoint controller 从必需的 checkpoint application surface
        // 接线（绝不在传输层构造数据库适配器）。
        const checkpointController = new AIAgentCheckpointController(checkpoints.agent);
        const langGraphCheckpointController = new AILangGraphCheckpointController(
          checkpoints.langGraph,
        );

        // ---------------------------------------------------------------
        // 2. 创建路由（注入平台中间件）并挂载到主路由
        //    Create routes (inject platform middleware) and mount them.
        // ---------------------------------------------------------------
        const goalRoutes = registerAIGoalGenerationRoutes(goalController, middleware);
        const capabilityRoutes = registerAICapabilitiesRoutes(
          capabilitiesController,
          middleware,
          openApiRegistry,
        );
        const agentRuntimeRoutes = registerAIAgentRuntimeRoutes(
          agentRuntimeController,
          middleware,
          openApiRegistry,
        );
        const providerRoutes = registerAIProviderRoutes(
          providerController,
          middleware,
          openApiRegistry,
        );
        const chatRoutes = registerAIChatRoutes(chatController, middleware, openApiRegistry);
        const assistantRoutes = registerAIAssistantRoutes(assistantController, middleware);
        const knowledgeQueryRoutes = registerAIKnowledgeQueryRoutes(
          knowledgeQueryController,
          middleware,
          openApiRegistry,
        );
        const knowledgeNoteRoutes = registerAIKnowledgeNoteRoutes(
          knowledgeNoteController,
          middleware,
          openApiRegistry,
        );
        const analyticsQueryRoutes = registerAIAnalyticsQueryRoutes(
          analyticsQueryController,
          middleware,
          openApiRegistry,
        );
        const evaluationReportRoutes = registerAIEvaluationReportRoutes(
          evaluationReportController,
          middleware,
          openApiRegistry,
        );
        const checkpointRoutes = registerAIAgentCheckpointRoutes(
          checkpointController,
          middleware,
          openApiRegistry,
        );
        const langGraphCheckpointRoutes = registerAILangGraphCheckpointRoutes(
          langGraphCheckpointController,
          middleware,
          openApiRegistry,
        );

        // Start the instance once BEFORE mounting any route: a failed start
        // must never leave a partial route set on the host router.
        // 先调用一次 `instance.start()` 再挂载路由：start 失败绝不能把半套路由
        // 留在宿主 router 上。
        options.instance.start();

        // Record the stack length before the first mount so a later mount
        // failure can roll back the already-installed AI routes.
        // 首次挂载前记录 stack 长度，中途挂载失败时能回滚已安装的 AI 路由。
        const stackLen = router.stack.length;
        try {
          // 挂载到主路由（模块自决前缀）
          router.use('/ai/providers', providerRoutes);
          router.use('/ai', capabilityRoutes);
          router.use('/ai/agents', agentRuntimeRoutes);
          router.use('/ai/chat', chatRoutes);
          router.use('/ai/assistant', assistantRoutes);
          router.use('/ai/knowledge', knowledgeQueryRoutes);
          router.use('/ai/knowledge-notes', knowledgeNoteRoutes);
          router.use('/ai/analytics', analyticsQueryRoutes);
          router.use('/ai', evaluationReportRoutes);
          router.use('/ai/generate', goalRoutes);
          router.use('/internal/agents/checkpoints', checkpointRoutes);
          router.use('/internal/agents/langgraph-checkpoints', langGraphCheckpointRoutes);
        } catch (mountError) {
          router.stack.length = stackLen;
          throw mountError;
        }

        state = 'registered';
      } catch (error) {
        state = 'failed';
        try {
          options.instance.dispose();
        } catch (disposeError) {
          logger.error(
            'AIApiModule: instance dispose failed during failed registration',
            disposeError,
          );
        }
        throw error;
      }
    },

    destroy() {
      if (state === 'disposed' || state === 'failed') {
        return;
      }
      state = 'disposed';
      options.instance.dispose();
    },
  };
}
