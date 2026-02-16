/**
 * AI Module — Electron Entry Point
 *
 * @module ai/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AIModule } from '../infrastructure-server';
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
    const mod = new AIModule('sqlite', ctx.db);

    const chatSvc = mod.chatService;
    const convSvc = mod.conversationService;
    const configSvc = mod.providerConfigService;
    const genSvc = mod.generationService;

    ipcMain.handle(Ch.CHAT, (_, dto) => chatSvc.sendMessage(dto));
    ipcMain.handle(Ch.CONVERSATION_LIST, (_, params) => convSvc.listConversations(params));
    ipcMain.handle(Ch.CONVERSATION_GET, (_, id) => convSvc.getConversation(id));
    ipcMain.handle(Ch.CONVERSATION_CREATE, (_, dto) => convSvc.createConversation(dto));
    ipcMain.handle(Ch.CONVERSATION_DELETE, (_, id) => convSvc.deleteConversation(id));
    ipcMain.handle(Ch.CONVERSATION_CLEAR, (_, id) => convSvc.clearConversation(id));
    ipcMain.handle(Ch.ANALYZE_TASK, (_, dto) => genSvc.analyzeTask(dto));
    ipcMain.handle(Ch.ANALYZE_GOAL, (_, dto) => genSvc.analyzeGoal(dto));
    ipcMain.handle(Ch.SUGGEST_SCHEDULE, (_, dto) => genSvc.suggestSchedule(dto));
    ipcMain.handle(Ch.SUGGEST_BREAKDOWN, (_, dto) => genSvc.suggestBreakdown(dto));
    ipcMain.handle(Ch.DECOMPOSE_TASK, (_, dto) => genSvc.decomposeTask(dto));
    ipcMain.handle(Ch.GET_CONFIG, () => configSvc.getConfig());
    ipcMain.handle(Ch.UPDATE_CONFIG, (_, dto) => configSvc.updateConfig(dto));

    logger.info('AI module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('AI module destroyed');
  },
};
