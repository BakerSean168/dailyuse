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
import { createAIPowerSyncModule, type AIModuleInstance } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import type { IKnowledgeNotePersistencePort } from '../application-server';

const logger = createLogger('AIElectron');

// ---------------------------------------------------------------------------
// IPC Channel Constants — IPC 频道常量
// ---------------------------------------------------------------------------

const Ch = {
  PROVIDER_CREATE: 'ai:provider:create',
  PROVIDER_LIST: 'ai:provider:list',
  PROVIDER_GET: 'ai:provider:get',
  PROVIDER_UPDATE: 'ai:provider:update',
  PROVIDER_DELETE: 'ai:provider:delete',
  PROVIDER_TEST: 'ai:provider:test',
  PROVIDER_SET_DEFAULT: 'ai:provider:set-default',
  GOAL_GENERATE: 'ai:goal:generate',
  CONVERSATION_CREATE: 'ai:chat:conversation:create',
  CONVERSATION_UPDATE: 'ai:chat:conversation:update',
  CONVERSATION_LIST: 'ai:chat:conversation:list',
  CONVERSATION_GET: 'ai:chat:conversation:get',
  CONVERSATION_DELETE: 'ai:chat:conversation:delete',
  MESSAGE_SEND: 'ai:chat:message:send',
  MESSAGE_LIST: 'ai:chat:message:list',
  KNOWLEDGE_NOTE_CREATE: 'ai:knowledge-note:create',
} as const;

const channels = Object.values(Ch);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveIdentityId(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>;
    return String(value.identityId ?? value.accountId ?? 'local-user');
  }
  return 'local-user';
}

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
}): IElectronModule {
  return {
    name: 'AI',

    register(ctx: IElectronModuleContext): void {
      // ---------------------------------------------------------------
      // 1. Composition Root — 使用 PowerSync 便捷工厂
      //    Uses the PowerSync convenience factory with explicit deps.
      // ---------------------------------------------------------------
      const aiModule = createAIPowerSyncModule(ctx.db, {
        knowledgeNotePersistence: options.createKnowledgeNotePersistence(ctx),
        getKnowledgeNoteSubpath: createKnowledgeNoteSubpathResolver(ctx),
      });
      activeAIModule = aiModule;
      aiModule.start();

      // ---------------------------------------------------------------
      // 2. IPC Handlers — 通过 api 门面统一注册
      //    Registered via the module's api facade consistently.
      // ---------------------------------------------------------------

      // -- Provider Config --
      ipcMain.handle(Ch.PROVIDER_CREATE, async (_, dto) =>
        aiModule.api.createProvider(resolveIdentityId(dto), dto),
      );
      ipcMain.handle(Ch.PROVIDER_LIST, async (_, params) => ({
        data: await aiModule.api.listProviders(resolveIdentityId(params)),
      }));
      ipcMain.handle(Ch.PROVIDER_GET, async (_, id) => aiModule.api.getProvider(id));
      ipcMain.handle(Ch.PROVIDER_UPDATE, async (_, payload) =>
        aiModule.api.updateProvider(String(payload.id), payload),
      );
      ipcMain.handle(Ch.PROVIDER_DELETE, async (_, id) => aiModule.api.deleteProvider(id));
      ipcMain.handle(Ch.PROVIDER_TEST, async (_, dto) => aiModule.api.testConnection(dto));
      ipcMain.handle(Ch.PROVIDER_SET_DEFAULT, async (_, dto) =>
        aiModule.api.setDefaultProvider(dto.providerId, resolveIdentityId(dto)),
      );

      // -- Goal Generation --
      ipcMain.handle(Ch.GOAL_GENERATE, async (_, dto) =>
        aiModule.api.generateGoal({
          identityId: resolveIdentityId(dto),
          ...dto,
        }),
      );

      // -- Conversations --
      ipcMain.handle(Ch.CONVERSATION_CREATE, async (_, dto) =>
        aiModule.api.createConversation(resolveIdentityId(dto), dto.name),
      );
      ipcMain.handle(Ch.CONVERSATION_UPDATE, async (_, dto) =>
        aiModule.api.updateConversation(String(dto.id), {
          name: String(dto.name),
        }),
      );
      ipcMain.handle(Ch.CONVERSATION_LIST, async (_, dto) =>
        aiModule.api.listConversations(
          resolveIdentityId(dto),
          Number(dto?.page ?? 1),
          Number(dto?.pageSize ?? 20),
        ),
      );
      ipcMain.handle(Ch.CONVERSATION_GET, async (_, id) => {
        const conversation = await aiModule.api.getConversation(String(id), true);
        return conversation?.toClientDTO() ?? null;
      });
      ipcMain.handle(Ch.CONVERSATION_DELETE, async (_, id) =>
        aiModule.api.deleteConversation(String(id)),
      );

      // -- Chat Messages --
      ipcMain.handle(Ch.MESSAGE_SEND, async (_, dto) =>
        aiModule.api.sendMessage(
          resolveIdentityId(dto),
          String(dto.conversationId),
          String(dto.content),
          dto.providerId,
        ),
      );
      ipcMain.handle(Ch.MESSAGE_LIST, async (_, dto) => {
        const conversation = await aiModule.api.getConversation(String(dto.conversationId), true);
        const messages =
          conversation?.getAllMessages().map((message) => message.toClientDTO()) ?? [];
        return {
          data: messages,
          total: messages.length,
          page: Number(dto?.page ?? 1),
          pageSize: Number(dto?.pageSize ?? 50),
        };
      });

      // -- Knowledge Notes --
      ipcMain.handle(Ch.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
        aiModule.api.createKnowledgeNote(resolveIdentityId(dto), dto),
      );

      logger.info('AI module registered');
    },

    destroy(): void {
      for (const channel of channels) {
        ipcMain.removeHandler(channel);
      }
      activeAIModule?.dispose();
      activeAIModule = null;
      logger.info('AI module destroyed');
    },
  };
}
