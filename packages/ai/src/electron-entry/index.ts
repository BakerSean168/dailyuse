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
 * @module ai/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AIChannels, AIStreamChannels } from '@dailyuse/contracts/electron';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  AIServiceAnalyticsQueryAdapter,
  AIEvaluationReportFileAdapter,
  createAIPowerSyncModule,
  type AIModuleInstance,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeQueryAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
} from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import type {
  IAnalyticsReadPort,
  IAIAutomationToolExecutorPort,
  IKnowledgeNotePersistencePort,
  IKnowledgeSourcePort,
} from '../application-server';
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
  GOAL_AUTOMATE: 'ai:goal:automate',
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
export function createAIElectronModule(options: {
  createKnowledgeNotePersistence(context: IElectronModuleContext): IKnowledgeNotePersistencePort;
  createKnowledgeSourcePort(context: IElectronModuleContext): IKnowledgeSourcePort;
  createAnalyticsReadPort(context: IElectronModuleContext): IAnalyticsReadPort;
  createAutomationToolExecutor(context: IElectronModuleContext): IAIAutomationToolExecutorPort;
}): IElectronModule {
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
          aiModule.api.createProvider(requestContext.identityId, dto),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_LIST, async () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.listProviders(requestContext.identityId),
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
          aiModule.api.testConnection(requestContext.identityId, dto),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_SET_DEFAULT, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.setDefaultProvider(dto.providerId, requestContext.identityId),
        ),
      );
      ipcMain.handle(Ch.PROVIDER_REFRESH_MODELS, async (_, id) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.refreshProviderModels(requestContext.identityId, String(id)),
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
      ipcMain.handle(Ch.GOAL_AUTOMATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.automateGoal({
            identityId: requestContext.identityId,
            ...dto,
          }),
        ),
      );

      // -- Conversations --
      ipcMain.handle(Ch.CONVERSATION_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createConversation(requestContext.identityId, dto.name),
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
            requestContext.identityId,
            Number(dto?.page ?? 1),
            Number(dto?.pageSize ?? 20),
          ),
        ),
      );
      ipcMain.handle(Ch.CONVERSATION_GET, async (_, id) =>
        withAuthenticatedValue(ctx, async () => {
          const conversation = await aiModule.api.getConversation(String(id), true);
          return conversation?.toClientDTO() ?? null;
        }),
      );
      ipcMain.handle(Ch.CONVERSATION_DELETE, async (_, id) =>
        withAuthenticatedValue(ctx, async () => aiModule.api.deleteConversation(String(id))),
      );

      // -- Chat Messages --
      ipcMain.handle(Ch.MESSAGE_SEND, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.sendMessage(
            requestContext.identityId,
            String(dto.conversationId),
            String(dto.content),
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
                requestContext.identityId,
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
          const conversation = await aiModule.api.getConversation(String(dto.conversationId), true);
          const messages =
            conversation?.getAllMessages().map((message) => message.toClientDTO()) ?? [];
          return {
            data: messages,
            total: messages.length,
            page: Number(dto?.page ?? 1),
            pageSize: Number(dto?.pageSize ?? 50),
          };
        }),
      );

      // -- Knowledge Notes --
      ipcMain.handle(Ch.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.createKnowledgeNote(requestContext.identityId, dto),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryKnowledge(requestContext.identityId, dto),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_EXPAND, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.expandKnowledge(requestContext.identityId, dto),
        ),
      );
      ipcMain.handle(Ch.KNOWLEDGE_REINDEX, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.reindexKnowledge(requestContext.identityId, dto ?? {}),
        ),
      );
      ipcMain.handle(Ch.ANALYTICS_QUERY, async (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          aiModule.api.queryAnalytics(requestContext.identityId, dto),
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
