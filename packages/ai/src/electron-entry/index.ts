/**
 * AI Module — Electron Entry Point
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AIContainer, AISqliteModule } from '../infrastructure-server/sqlite';
import { createLogger } from '@dailyuse/utils';
import { DesktopAIRuntime } from './services/desktop-ai-runtime';

const logger = createLogger('AIElectron');

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

function resolveIdentityId(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>;
    return String(value.identityId ?? value.accountId ?? 'local-user');
  }
  return 'local-user';
}

export const AIElectronModule: IElectronModule = {
  name: 'AI',

  register(ctx: IElectronModuleContext): void {
    const mod = new AISqliteModule(ctx.db);
    const desktopRuntime = new DesktopAIRuntime(
      ctx.db,
      mod.providerConfigRepository,
      async (identityId: string) => {
        const row = ctx.db
          .prepare('SELECT preferences FROM user_settings WHERE identity_id = ? LIMIT 1')
          .get(identityId) as { preferences?: string } | undefined;

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
      },
    );

    ipcMain.handle(Ch.PROVIDER_CREATE, async (_, dto) =>
      mod.providerConfigService.createProvider(resolveIdentityId(dto), dto),
    );
    ipcMain.handle(Ch.PROVIDER_LIST, async (_, params) => ({
      data: await mod.providerConfigService.listProviders(resolveIdentityId(params)),
    }));
    ipcMain.handle(Ch.PROVIDER_GET, async (_, id) => mod.providerConfigService.getProvider(id));
    ipcMain.handle(Ch.PROVIDER_UPDATE, async (_, payload) =>
      mod.providerConfigService.updateProvider(String(payload.id), payload),
    );
    ipcMain.handle(Ch.PROVIDER_DELETE, async (_, id) =>
      mod.providerConfigService.deleteProvider(id),
    );
    ipcMain.handle(Ch.PROVIDER_TEST, async (_, dto) =>
      mod.providerConfigService.testConnection(dto),
    );
    ipcMain.handle(Ch.PROVIDER_SET_DEFAULT, async (_, dto) =>
      mod.providerConfigService.setDefaultProvider(dto.providerId, resolveIdentityId(dto)),
    );

    ipcMain.handle(Ch.GOAL_GENERATE, async (_, dto) =>
      mod.goalGenerationService.generateGoal({
        identityId: resolveIdentityId(dto),
        ...dto,
      }),
    );

    ipcMain.handle(Ch.CONVERSATION_CREATE, async (_, dto) =>
      mod.conversationService.createConversation(resolveIdentityId(dto), dto.name),
    );
    ipcMain.handle(Ch.CONVERSATION_UPDATE, async (_, dto) =>
      mod.conversationService.updateConversation(String(dto.id), { name: String(dto.name) }),
    );
    ipcMain.handle(Ch.CONVERSATION_LIST, async (_, dto) =>
      mod.conversationService.listConversations(
        resolveIdentityId(dto),
        Number(dto?.page ?? 1),
        Number(dto?.pageSize ?? 20),
      ),
    );
    ipcMain.handle(Ch.CONVERSATION_GET, async (_, id) => {
      const conversation = await mod.conversationService.getConversation(String(id), true);
      return conversation?.toClientDTO() ?? null;
    });
    ipcMain.handle(Ch.CONVERSATION_DELETE, async (_, id) =>
      mod.conversationService.deleteConversation(String(id)),
    );

    ipcMain.handle(Ch.MESSAGE_SEND, async (_, dto) =>
      mod.chatService.sendMessage(
        resolveIdentityId(dto),
        String(dto.conversationId),
        String(dto.content),
        dto.providerId,
      ),
    );
    ipcMain.handle(Ch.MESSAGE_LIST, async (_, dto) => {
      const conversation = await mod.conversationService.getConversation(
        String(dto.conversationId),
        true,
      );
      const messages = conversation?.getAllMessages().map((message) => message.toClientDTO()) ?? [];
      return {
        data: messages,
        total: messages.length,
        page: Number(dto?.page ?? 1),
        pageSize: Number(dto?.pageSize ?? 50),
      };
    });

    ipcMain.handle(Ch.KNOWLEDGE_NOTE_CREATE, async (_, dto) =>
      desktopRuntime.knowledgeNoteService.createKnowledgeNote(resolveIdentityId(dto), dto),
    );

    logger.info('AI module registered');
  },

  destroy(): void {
    AIContainer.getInstance().reset();
    for (const channel of channels) {
      ipcMain.removeHandler(channel);
    }
    logger.info('AI module destroyed');
  },
};
