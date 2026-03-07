/**
 * AI Module — Electron Entry Point
 *
 * @module ai/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AISqliteModule, AIContainer } from '../infrastructure-server/sqlite';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIElectron');

const Ch = {
  CHAT: 'ai:chat',
  CONVERSATION_LIST: 'ai:conversation:list',
  CONVERSATION_GET: 'ai:conversation:get',
  CONVERSATION_CREATE: 'ai:conversation:create',
  CONVERSATION_DELETE: 'ai:conversation:delete',
  CONVERSATION_CLEAR: 'ai:conversation:clear',
  ANALYZE_TASK: 'ai:analyze:task',
  ANALYZE_GOAL: 'ai:analyze:goal',
  SUGGEST_SCHEDULE: 'ai:suggest:schedule',
  SUGGEST_BREAKDOWN: 'ai:suggest:breakdown',
  DECOMPOSE_TASK: 'ai:task:decompose',
  GET_CONFIG: 'ai:config:get',
  UPDATE_CONFIG: 'ai:config:update',
} as const;

const channels = Object.values(Ch);

export const AIElectronModule: IElectronModule = {
  name: 'AI',

  register(ctx: IElectronModuleContext): void {
    const mod = new AISqliteModule(ctx.db);

    const chatSvc = mod.chatService;
    const convSvc = mod.conversationService;
    const configSvc = mod.providerConfigService;
    const genSvc = mod.generationService;

    ipcMain.handle(Ch.CHAT, (_, dto) =>
      chatSvc.sendMessage(dto.identityId, dto.conversationId, dto.content, dto.provider, dto.model),
    );
    ipcMain.handle(Ch.CONVERSATION_LIST, (_, params) =>
      convSvc.listConversations(params.identityId, params.page, params.limit),
    );
    ipcMain.handle(Ch.CONVERSATION_GET, (_, payload) => {
      if (typeof payload === 'string') {
        return convSvc.getConversation(payload);
      }
      return convSvc.getConversation(payload.conversationId, payload.includeMessages);
    });
    ipcMain.handle(Ch.CONVERSATION_CREATE, (_, dto) =>
      convSvc.createConversation(dto.identityId, dto.title),
    );
    ipcMain.handle(Ch.CONVERSATION_DELETE, (_, id) => convSvc.deleteConversation(id));
    ipcMain.handle(Ch.CONVERSATION_CLEAR, (_, id) => convSvc.deleteConversation(id));
    ipcMain.handle(Ch.ANALYZE_TASK, (_, dto) => genSvc.summarizeText(dto));
    ipcMain.handle(Ch.ANALYZE_GOAL, (_, dto) => genSvc.generateGoal(dto));
    ipcMain.handle(Ch.SUGGEST_SCHEDULE, (_, dto) => genSvc.generateTasks(dto));
    ipcMain.handle(Ch.SUGGEST_BREAKDOWN, (_, dto) => genSvc.generateKeyResults(dto));
    ipcMain.handle(Ch.DECOMPOSE_TASK, (_, dto) => genSvc.generateTasks(dto));
    ipcMain.handle(Ch.GET_CONFIG, (_, identityId) => configSvc.getDefaultProvider(identityId));
    ipcMain.handle(Ch.UPDATE_CONFIG, (_, dto) => {
      if (dto?.id) {
        return configSvc.updateProvider(dto.id, dto);
      }
      return configSvc.createProvider(dto.identityId, dto);
    });

    logger.info('AI module registered');
  },

  destroy(): void {
    AIContainer.getInstance().reset();
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('AI module destroyed');
  },
};
