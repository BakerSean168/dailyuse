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
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AIStreamChannels } from '@dailyuse/contracts/electron';
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

// ---------------------------------------------------------------------------
// IPC Channel Constants — IPC 频道常量
// ---------------------------------------------------------------------------

const Ch = {
  CAPABILITIES_GET: 'ai:capabilities:get',
  PROVIDER_CREATE: 'ai:provider:create',
  PROVIDER_LIST: 'ai:provider:list',
  PROVIDER_GET: 'ai:provider:get',
  PROVIDER_UPDATE: 'ai:provider:update',
  PROVIDER_DELETE: 'ai:provider:delete',
  PROVIDER_TEST: 'ai:provider:test',
  PROVIDER_SET_DEFAULT: 'ai:provider:set-default',
  PROVIDER_REFRESH_MODELS: 'ai:provider:refresh-models',
  GOAL_GENERATE: 'ai:goal:generate',
  CONVERSATION_CREATE: 'ai:chat:conversation:create',
  CONVERSATION_UPDATE: 'ai:chat:conversation:update',
  CONVERSATION_LIST: 'ai:chat:conversation:list',
  CONVERSATION_GET: 'ai:chat:conversation:get',
  CONVERSATION_DELETE: 'ai:chat:conversation:delete',
  MESSAGE_SEND: 'ai:chat:message:send',
  MESSAGE_LIST: 'ai:chat:message:list',
  MESSAGE_STREAM_START: 'ai:chat:message:stream:start',
  MESSAGE_STREAM_CANCEL: 'ai:chat:message:stream:cancel',
  MESSAGE_STREAM_CHUNK: 'ai:chat:message:stream:chunk',
  MESSAGE_STREAM_DONE: 'ai:chat:message:stream:done',
  MESSAGE_STREAM_ERROR: 'ai:chat:message:stream:error',
  KNOWLEDGE_EXPAND: 'ai:knowledge:expand',
  KNOWLEDGE_QUERY: 'ai:knowledge:query',
  KNOWLEDGE_REINDEX: 'ai:knowledge:reindex',
  KNOWLEDGE_NOTE_CREATE: 'ai:knowledge-note:create',
  ANALYTICS_QUERY: 'ai:analytics:query',
  AGENT_RUN_LIST: 'ai:agent:run:list',
  AGENT_RUN_START: 'ai:agent:run:start',
  AGENT_RUN_RESUME: 'ai:agent:run:resume',
  AGENT_RUN_GET: 'ai:agent:run:get',
  AGENT_EVENTS_GET: 'ai:agent:events:get',
  EVALUATION_OVERVIEW_GET: 'ai:evaluations:overview:get',
} as const;

const channels = Object.values(Ch);

type StreamSession = {
  abortController: AbortController;
  webContentsId: number;
};

const activeStreamSessions = new Map<string, StreamSession>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createKnowledgeNoteSubpathResolver(ctx: IElectronModuleContext) {
  return async (identityId: string): Promise<string> => {
    const row = await ctx.db.getOptional<{ preferences?: string }>(
      'SELECT preferences FROM user_settings WHERE identity_id = ? LIMIT 1',
      [identityId],
    );

    if (!row?.preferences) {
      return '';
    }

    try {
      const preferences = JSON.parse(row.preferences) as {
        ai?: { knowledgeNoteSubpath?: string };
      };
      return preferences.ai?.knowledgeNoteSubpath ?? '';
    } catch {
      return '';
    }
  };
}

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
        getKnowledgeNoteSubpath: createKnowledgeNoteSubpathResolver(ctx),
      });
      activeAIModule = aiModule;
      aiModule.start();

      // ---------------------------------------------------------------
      // 2. IPC Handlers — 通过 api 门面统一注册
      //    Registered via the module's api facade consistently.
      // ---------------------------------------------------------------

      // -- Provider Config --
      ipcMain.handle(Ch.CAPABILITIES_GET, async () =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getCapabilities()),
      );
      ipcMain.handle(Ch.PROVIDER_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createProvider(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_LIST, async () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listProviders({ identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_GET, async (_, id) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getProvider(id)),
      );
      ipcMain.handle(Ch.PROVIDER_UPDATE, async (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          aiModule.api.updateProvider(String(payload.id), payload),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_DELETE, async (_, id) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.deleteProvider(id)),
      );
      ipcMain.handle(Ch.PROVIDER_TEST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.testConnection(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_SET_DEFAULT, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.setDefaultProvider(dto.providerId, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_REFRESH_MODELS, async (_, id) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.refreshProviderModels(String(id), { identityId: requestContext.identityId }),
        ),
      );

      // -- Goal Generation --
      ipcMain.handle(Ch.GOAL_GENERATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.generateGoal({
            identityId: requestContext.identityId,
            ...dto,
          }),
        ),
      );

      // -- Conversations --
      ipcMain.handle(Ch.CONVERSATION_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createConversation({ identityId: requestContext.identityId }, dto.name),
        ),
      );
      ipcMain.handle(Ch.CONVERSATION_UPDATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async () =>
          aiModule.api.updateConversation(String(dto.id), {
            name: String(dto.name),
          }),
        ),
      );
      ipcMain.handle(Ch.CONVERSATION_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listConversations(
            { identityId: requestContext.identityId },
            Number(dto?.page ?? 1),
            Number(dto?.pageSize ?? 20),
          ),
        ),
      );
      ipcMain.handle(Ch.CONVERSATION_GET, async (_, id) =>
        withAuthenticatedValue(ctx, async () => {
          const result = await aiModule.api.getConversation(String(id), true);
          if (!result.ok) return result;
          return result.data ?? null;
        }),
      );
      ipcMain.handle(Ch.CONVERSATION_DELETE, async (_, id) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.deleteConversation(String(id))),
      );

      // -- Chat Messages --
      ipcMain.handle(Ch.MESSAGE_SEND, async (_, dto) =>
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
      ipcMain.handle(Ch.MESSAGE_STREAM_START, async (event, dto) =>
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
      ipcMain.handle(Ch.MESSAGE_STREAM_CANCEL, async (event, streamId) =>
        withAuthenticatedValue(ctx, async () => {
          const session = activeStreamSessions.get(String(streamId));
          if (session && session.webContentsId === event.sender.id) {
            session.abortController.abort();
            activeStreamSessions.delete(String(streamId));
          }
          return ok(null);
        }),
      );
      ipcMain.handle(Ch.MESSAGE_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async () => {
          const result = await aiModule.api.getConversation(String(dto.conversationId), true);
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
      ipcMain.handle(Ch.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createKnowledgeNote(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryKnowledge(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_EXPAND, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.expandKnowledge(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_REINDEX, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.reindexKnowledge(dto ?? {}, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.ANALYTICS_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryAnalytics(dto, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.AGENT_RUN_LIST, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listAgentRuns(dto ?? {}, { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.AGENT_RUN_START, async (_, dto) =>
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
      ipcMain.handle(Ch.AGENT_RUN_RESUME, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.resumeAgentRun(
            String(dto.runId),
            dto.payload,
            { identityId: requestContext.identityId },
          ),
        ),
      );
      ipcMain.handle(Ch.AGENT_RUN_GET, async (_, runId) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.getAgentRun(String(runId), { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.AGENT_EVENTS_GET, async (_, runId) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.getAgentEvents(String(runId), { identityId: requestContext.identityId }),
        ),
      );
      ipcMain.handle(Ch.EVALUATION_OVERVIEW_GET, async (_, dto) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.getEvaluationOverview(dto ?? {})),
      );

      logger.info('AI module registered');
    },

    destroy(): void {
      for (const channel of channels) {
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
