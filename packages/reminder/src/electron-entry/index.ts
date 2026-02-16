/**
 * Reminder Module — Electron Entry Point
 *
 * @module reminder/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ReminderModule } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderElectron');

const Ch = {
  TEMPLATE_LIST: 'reminder:template:list',
  TEMPLATE_GET: 'reminder:template:get',
  TEMPLATE_CREATE: 'reminder:template:create',
  TEMPLATE_UPDATE: 'reminder:template:update',
  TEMPLATE_DELETE: 'reminder:template:delete',
  TEMPLATE_TOGGLE_ENABLED: 'reminder:template:toggle-enabled',
  TEMPLATE_MOVE_TO_GROUP: 'reminder:template:move-to-group',
  GROUP_LIST: 'reminder:group:list',
  GROUP_CREATE: 'reminder:group:create',
  GROUP_UPDATE: 'reminder:group:update',
  GROUP_DELETE: 'reminder:group:delete',
} as const;

const channels = Object.values(Ch);

export const ReminderElectronModule: IElectronModule = {
  name: 'Reminder',

  register(ctx: IElectronModuleContext): void {
    const mod = new ReminderModule('sqlite', ctx.db);

    const templateRepo = mod.reminderTemplateRepository;
    const groupRepo = mod.reminderGroupRepository;

    // Template handlers
    ipcMain.handle(Ch.TEMPLATE_LIST, (_, params) => templateRepo.findAll(params));
    ipcMain.handle(Ch.TEMPLATE_GET, (_, id) => templateRepo.findById(id));
    ipcMain.handle(Ch.TEMPLATE_CREATE, (_, dto) => templateRepo.save(dto));
    ipcMain.handle(Ch.TEMPLATE_UPDATE, (_, dto) => templateRepo.save(dto));
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_, id) => templateRepo.delete(id));

    // Group handlers
    ipcMain.handle(Ch.GROUP_LIST, (_, params) => groupRepo.findAll(params));
    ipcMain.handle(Ch.GROUP_CREATE, (_, dto) => groupRepo.save(dto));
    ipcMain.handle(Ch.GROUP_UPDATE, (_, dto) => groupRepo.save(dto));
    ipcMain.handle(Ch.GROUP_DELETE, (_, id) => groupRepo.delete(id));

    logger.info('Reminder module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Reminder module destroyed');
  },
};
