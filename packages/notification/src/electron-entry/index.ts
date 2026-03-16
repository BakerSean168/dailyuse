/**
 * Notification Module — Electron Entry Point.
 * 通知模块 — Electron 入口点。
 *
 * Self-contained notification runtime assembly for Electron main process.
 * 通知模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using the NotificationController.
 * 通过模块工厂实例化 PowerSync 仓储，并使用 NotificationController 注册 IPC 处理器。
 *
 * @module notification/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createNotificationPowerSyncModule } from '../infrastructure-server/powersync';
import { createLogger } from '@dailyuse/utils';
import { createNotificationTransportHandlers } from '../api/transport-handlers';
import { createNotificationRuntimeContribution } from '../api/runtime';
import type { NotificationModuleInstance } from '../infrastructure-server';
import { fail } from '@dailyuse/contracts/result';

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
} as const;

const channels = Object.values(Ch);
let activeNotificationModule: NotificationModuleInstance | null = null;

export const NotificationElectronModule: IElectronModule = {
  name: 'Notification',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — create module with PowerSync repositories + runtime contributions.
    //    Runtime contributions are passed INTO the module factory so the module's
    //    start()/dispose() lifecycle properly manages event listeners.
    //    No leaked listeners on repeated register/destroy cycles.
    //
    // 组合根 — 使用 PowerSync 仓储 + 运行时贡献创建模块。
    // 运行时贡献传入模块工厂，由模块的 start()/dispose() 生命周期
    // 正确管理事件监听器。重复注册/销毁不会泄漏监听器。
    const runtimeContribution = createNotificationRuntimeContribution();
    const notificationModule = createNotificationPowerSyncModule(db, runtimeContribution);

    activeNotificationModule = notificationModule;
    notificationModule.start();

    // 2. Transport handlers (shared mapping between HTTP and IPC).
    // 传输处理器（HTTP 和 IPC 之间的共享映射）。
    const handlers = createNotificationTransportHandlers(notificationModule.api);

    // 3. IPC Handlers — preserve all existing channels.
    // IPC 处理器 — 保留所有现有通道。
    ipcMain.handle(Ch.LIST, (_, params) => handlers.listNotifications(params));
    ipcMain.handle(Ch.GET, (_, id) => handlers.getNotification(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => handlers.createNotification(dto));
    ipcMain.handle(Ch.MARK_READ, (_, id) => handlers.markAsRead(id));
    ipcMain.handle(Ch.MARK_ALL_READ, async () => {
      const identityId = await ctx.auth.requireIdentityId();
      return handlers.markAllAsRead(identityId);
    });
    ipcMain.handle(Ch.DELETE, (_, id) => handlers.deleteNotification(id));
    ipcMain.handle(Ch.CLEAR_ALL, async (_, ids) => {
      if (Array.isArray(ids) && ids.length > 0) {
        return handlers.batchDelete({ notificationIds: ids });
      }
      return fail({ code: 'VALIDATION_ERROR', message: 'notification ids are required' });
    });
    ipcMain.handle(Ch.GET_UNREAD_COUNT, async () => {
      const identityId = await ctx.auth.requireIdentityId();
      return handlers.getUnreadCount(identityId);
    });
    logger.info('Notification module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeNotificationModule?.dispose();
    activeNotificationModule = null;
    logger.info('Notification module destroyed');
  },
};
