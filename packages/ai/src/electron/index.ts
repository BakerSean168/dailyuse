/**
 * AI Module — Electron Entry Point.
 * AI 模块 — Electron 入口点。
 *
 * Self-contained AI runtime assembly for Electron main process.
 * AI 模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using the module's ApplicationPort.
 * 通过模块工厂实例化 PowerSync 仓储，并使用模块的 ApplicationPort 注册 IPC 处理器。
 *
 * Follows the governance reference pattern:
 * 1. Composition Root via `createAIPowerSyncModule(db, options)`
 * 2. IPC handler registration using the module's `api` facade
 * 3. `destroy()` for graceful cleanup
 *
 * @module ai/electron
 */

import { ipcMain } from 'electron';
import {
  AIChannels,
  AIStreamChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  AIServiceAnalyticsQueryAdapter,
  AIServiceAgentRuntimeAdapter,
  AIEvaluationReportFileAdapter,
  createAIPowerSyncModule,
  type AIModuleInstance,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeQueryAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
} from '../server/infrastructure';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  IAnalyticsReadPort,
  IAIAutomationToolExecutorPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
} from '../server/application';
import { withAuthenticatedValue } from './authenticated-ipc';
import { getAIServiceRuntimeConfig } from '../shared/config/env';

const logger = createLogger('AIElectron');

const allChannels = Object.values(AIChannels);

type StreamSession = {
  abortController: AbortController;
  webContentsId: number;
};

const activeStreamSessions = new Map<string, StreamSession>();

// ---------------------------------------------------------------------------
// Electron Module Factory — Electron 模块工厂
// ---------------------------------------------------------------------------

let activeAIModule: AIModuleInstance | null = null;

/**
 * Creates the AI Electron module with injected external collaborators.
 * 创建注入了外部协作者的 AI Electron 模块。
 *
 * Knowledge-note persistence comes from the host application because it
 * depends on the repository module's file-storage implementation.
 * 知识笔记持久化来自宿主应用，因为它依赖 repository 模块的文件存储实现。
 */
export function createAIElectronModule(options: AIElectronModuleOptions): IElectronModule {
  return createAIElectronModuleWithOptions(options);
}

export interface AIElectronModuleOptions {
  createKnowledgeNotePersistence(context: IElectronModuleContext): IKnowledgeNotePersistencePort;
  createKnowledgeSourcePort(context: IElectronModuleContext): IKnowledgeSourcePort;
  createAnalyticsReadPort(context: IElectronModuleContext): IAnalyticsReadPort;
  createAutomationToolExecutor(context: IElectronModuleContext): IAIAutomationToolExecutorPort;
}

function createAIElectronModuleWithOptions(options: AIElectronModuleOptions): IElectronModule {
  return {
    name: 'AI',

    register(ctx: IElectronModuleContext): void {
      const aiServiceRuntimeConfig = getAIServiceRuntimeConfig();

      // ---------------------------------------------------------------
      // 1. Composition Root — 使用 PowerSync 便捷工厂
      //    Uses the PowerSync convenience factory with explicit deps.
      // ---------------------------------------------------------------
      const aiModule = createAIPowerSyncModule(ctx.db, {
        chatExecutionPort: aiServiceRuntimeConfig
          ? new AIServiceChatExecutionAdapter(aiServiceRuntimeConfig)
          : undefined,
        goalPlanningPort: aiServiceRuntimeConfig
          ? new AIServiceGoalPlanningAdapter(aiServiceRuntimeConfig)
          : undefined,
        goalAutomationPlanningPort: aiServiceRuntimeConfig
          ? new AIServiceGoalAutomationAdapter(aiServiceRuntimeConfig)
          : undefined,
        automationToolExecutorPort: options.createAutomationToolExecutor(ctx),
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
        agentRuntimePort: aiServiceRuntimeConfig
          ? new AIServiceAgentRuntimeAdapter(aiServiceRuntimeConfig)
          : undefined,
        evaluationReportPort: new AIEvaluationReportFileAdapter(),
        knowledgeNotePersistence: options.createKnowledgeNotePersistence(ctx),
        knowledgeSourcePort: options.createKnowledgeSourcePort(ctx),
        analyticsReadPort: options.createAnalyticsReadPort(ctx),
      });
      activeAIModule = aiModule;
      aiModule.start();

      // ---------------------------------------------------------------
      // 2. IPC Handlers — 通过 api 门面统一注册
      //    Registered via the module's api facade consistently.
      // ---------------------------------------------------------------

      // -- Provider Config --
      ipcMain.handle(AIChannels.CAPABILITIES_GET, async () =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getCapabilities()),
      );
      ipcMain.handle(AIChannels.PROVIDER_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createProvider(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.PROVIDER_LIST, async () =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await aiModule.api.listProviders({
            identityId: requestContext.identityId,
          });
          if (!result.ok) {
            return result;
          }
          // Align Desktop IPC with contracts ListAIProviderConfigsRes / HTTP list envelope.
          return ok({ data: result.data });
        }),
      );
      ipcMain.handle(AIChannels.PROVIDER_GET, async (_, id) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getProvider(id)),
      );
      ipcMain.handle(AIChannels.PROVIDER_UPDATE, async (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          aiModule.api.updateProvider(String(payload.id), payload),
        ),
      );
      ipcMain.handle(AIChannels.PROVIDER_DELETE, async (_, id) =>
        withAuthenticatedValue(ctx, async () => {
          const result = await aiModule.api.deleteProvider(id);
          if (!result.ok) return result;
          // Align with HTTP void success: data:null (no undefined dual-track).
          return ok(null);
        }),
      );
      ipcMain.handle(AIChannels.PROVIDER_TEST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.testConnection(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.PROVIDER_SET_DEFAULT, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await aiModule.api.setDefaultProvider(dto.providerId, {
            identityId: requestContext.identityId,
          });
          if (!result.ok) return result;
          return ok(null);
        }),
      );
      ipcMain.handle(AIChannels.PROVIDER_REFRESH_MODELS, async (_, id) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.refreshProviderModels(String(id), { identityId: requestContext.identityId }),
        ),
      );

      // -- Goal Generation --
      ipcMain.handle(AIChannels.GOAL_GENERATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.generateGoal({
            identityId: requestContext.identityId,
            ...dto,
          }),
        ),
      );

      // -- Conversations --
      ipcMain.handle(AIChannels.CONVERSATION_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createConversation({ identityId: requestContext.identityId }, dto.name),
        ),
      );
      ipcMain.handle(AIChannels.CONVERSATION_UPDATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.updateConversation(
            String(dto.id),
            {
              name: String(dto.name),
            },
            { identityId: requestContext.identityId },
          ),
        ),
      );
      ipcMain.handle(AIChannels.CONVERSATION_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listConversations(
            { identityId: requestContext.identityId },
            Number(dto?.page ?? 1),
            Number(dto?.pageSize ?? 20),
          ),
        ),
      );
      ipcMain.handle(AIChannels.CONVERSATION_GET, async (_, id) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await aiModule.api.getConversation(
            String(id),
            { identityId: requestContext.identityId },
            true,
          );
          if (!result.ok) return result;
          return result.data ?? null;
        }),
      );
      ipcMain.handle(AIChannels.CONVERSATION_DELETE, async (_, id) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await aiModule.api.deleteConversation(String(id), {
            identityId: requestContext.identityId,
          });
          if (!result.ok) return result;
          return ok(null);
        }),
      );

      // -- Chat Messages --
      ipcMain.handle(AIChannels.MESSAGE_SEND, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.sendMessage(
            String(dto.conversationId),
            String(dto.content),
            { identityId: requestContext.identityId },
            dto.providerId,
            dto.model,
          ),
        ),
      );
      ipcMain.handle(AIChannels.MESSAGE_STREAM_START, async (event, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const payload = dto as {
            streamId?: unknown;
            conversationId?: unknown;
            content?: unknown;
            providerId?: unknown;
            model?: unknown;
          };
          const streamId = String(payload.streamId ?? '');
          if (!streamId) {
            return fail({ code: 'VALIDATION_ERROR', message: 'Missing streamId' });
          }

          const abortController = new AbortController();
          activeStreamSessions.set(streamId, {
            abortController,
            webContentsId: event.sender.id,
          });

          void (async () => {
            try {
              const result = await aiModule.api.streamMessage(
                String(payload.conversationId ?? ''),
                String(payload.content ?? ''),
                (chunk) => {
                  if (!event.sender.isDestroyed()) {
                    event.sender.send(AIStreamChannels.MESSAGE_STREAM_CHUNK, {
                      streamId,
                      chunk,
                    });
                  }
                },
                { identityId: requestContext.identityId },
                typeof payload.providerId === 'string' ? payload.providerId : undefined,
                typeof payload.model === 'string' ? payload.model : undefined,
                abortController.signal,
              );

              if (!event.sender.isDestroyed()) {
                event.sender.send(AIStreamChannels.MESSAGE_STREAM_DONE, {
                  streamId,
                  result,
                });
              }
            } catch (error) {
              const code =
                error instanceof Error &&
                (error as Error & { category?: string }).category === 'aborted'
                  ? 'ABORTED'
                  : 'INTERNAL_ERROR';
              if (!event.sender.isDestroyed()) {
                event.sender.send(AIStreamChannels.MESSAGE_STREAM_ERROR, {
                  streamId,
                  code,
                  message: error instanceof Error ? error.message : 'AI stream failed',
                });
              }
            } finally {
              activeStreamSessions.delete(streamId);
            }
          })();

          return ok(null);
        }),
      );
      ipcMain.handle(AIChannels.MESSAGE_STREAM_CANCEL, async (event, streamId) =>
        withAuthenticatedValue(ctx, async () => {
          const session = activeStreamSessions.get(String(streamId));
          if (session && session.webContentsId === event.sender.id) {
            session.abortController.abort();
            activeStreamSessions.delete(String(streamId));
          }
          return ok(null);
        }),
      );
      ipcMain.handle(AIChannels.MESSAGE_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await aiModule.api.getConversation(
            String(dto.conversationId),
            { identityId: requestContext.identityId },
            true,
          );
          if (!result.ok) return result;
          if (!result.data) {
            return fail({ code: 'NOT_FOUND', message: 'Conversation not found' });
          }
          const messages = result.data.messages ?? [];
          return ok({
            data: messages,
            total: messages.length,
            page: Number(dto?.page ?? 1),
            pageSize: Number(dto?.pageSize ?? 50),
          });
        }),
      );

      // -- Knowledge Notes --
      ipcMain.handle(AIChannels.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createKnowledgeNote(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.KNOWLEDGE_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryKnowledge(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.KNOWLEDGE_EXPAND, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.expandKnowledge(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.KNOWLEDGE_REINDEX, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.reindexKnowledge(dto ?? {}, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.ANALYTICS_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryAnalytics(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.AGENT_RUN_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listAgentRuns(dto ?? {}, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.AGENT_RUN_START, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.startAgentRun(
            {
              ...dto,
              identityId: requestContext.identityId,
            },
            { identityId: requestContext.identityId },
          ),
        ),
      );
      ipcMain.handle(AIChannels.AGENT_RUN_RESUME, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.resumeAgentRun(String(dto.runId), dto.payload, {
            identityId: requestContext.identityId,
          }),
        ),
      );
      ipcMain.handle(AIChannels.AGENT_RUN_GET, async (_, runId) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.getAgentRun(String(runId), { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.AGENT_EVENTS_GET, async (_, runId) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.getAgentEvents(String(runId), { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(AIChannels.EVALUATION_OVERVIEW_GET, async (_, dto) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getEvaluationOverview(dto ?? {})),
      );

      logger.info('AI module registered');
    },

    destroy(): void {
      for (const channel of allChannels) {
        ipcMain.removeHandler(channel);
      }
      for (const session of activeStreamSessions.values()) {
        session.abortController.abort();
      }
      activeStreamSessions.clear();
      activeAIModule?.dispose();
      activeAIModule = null;
      logger.info('AI module destroyed');
    },
  };
}
