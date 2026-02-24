/**
 * Notification Module — Electron Entry Point
 *
 * @module notification/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { NotificationModule } from '../infrastructure-server';
import { NotificationContainer } from '../infrastructure-server/di/notification-container';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationElectron');

const Ch = {
  LIST: 'notification:list',
  GET: 'notification:get',
  CREATE: 'notification:create',
  MARK_READ: 'notification:mark-read',
  MARK_ALL_READ: 'notification:mark-all-read',
  DELETE: 'notification:delete',
  CLEAR_ALL: 'notification:clear-all',
  GET_UNREAD_COUNT: 'notification:unread-count',
  SETTINGS_GET: 'notification:settings:get',
  SETTINGS_UPDATE: 'notification:settings:update',
} as const;

const channels = Object.values(Ch);

export const NotificationElectronModule: IElectronModule = {
  name: 'Notification',

  register(ctx: IElectronModuleContext): void {
    const mod = new NotificationModule('sqlite', ctx.db);

    const svc = mod.notificationService;
    const templateSvc = mod.notificationTemplateService;

    ipcMain.handle(Ch.LIST, (_, params) => svc.listNotifications(params));
    ipcMain.handle(Ch.GET, (_, id) => svc.getNotification(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => svc.createNotification(dto));
    ipcMain.handle(Ch.MARK_READ, (_, id) => svc.markAsRead(id));
    ipcMain.handle(Ch.MARK_ALL_READ, (_, identityId) => svc.markAllAsRead(identityId));
    ipcMain.handle(Ch.DELETE, (_, id) => svc.deleteNotification(id));
    ipcMain.handle(Ch.CLEAR_ALL, (_, identityId) => svc.clearAll(identityId));
    ipcMain.handle(Ch.GET_UNREAD_COUNT, (_, identityId) => svc.getUnreadCount(identityId));
    ipcMain.handle(Ch.SETTINGS_GET, (_, identityId) => mod.notificationChannelService.getPreferences(identityId));
    ipcMain.handle(Ch.SETTINGS_UPDATE, (_, dto) => mod.notificationChannelService.updatePreferences(dto));

    logger.info('Notification module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    NotificationContainer.getInstance().reset();
    logger.info('Notification module destroyed');
  },
};
