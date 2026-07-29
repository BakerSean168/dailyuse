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
 * @module notification/electron
 */

import { ipcMain } from 'electron';
import {
  NotificationChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import { fail, ok } from '@memoflow/contracts/result';
import { CreateNotificationUseCase } from '../commands';
import type { ScheduleNotificationPort } from '../schedule-execution';
import {
  createNotificationPowerSyncModule,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationRepository,
  PowerSyncNotificationTemplateRepository,
} from '../server/infrastructure';
import { createLogger } from '@memoflow/utils/logger';
import {
  createNotificationRuntimeContribution,
  type NotificationModuleInstance,
} from '../server/infrastructure';
import type { INotificationRepository } from '../server/domain/repositories';
import { NotificationController } from '../server/transport';
import { withAuthenticatedIdentity, withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('NotificationElectron');

// Destroy tears down the full NotificationChannels surface.
// Core CRUD handlers are registered here; custom renderer channels are registered by
// desktop custom-notification.manager but share this cleanup set.
const allChannels = [
  NotificationChannels.LIST,
  NotificationChannels.GET,
  NotificationChannels.CREATE,
  NotificationChannels.MARK_READ,
  NotificationChannels.MARK_ALL_READ,
  NotificationChannels.DELETE,
  NotificationChannels.CLEAR_ALL,
  NotificationChannels.GET_UNREAD_COUNT,
  NotificationChannels.PREFERENCES_GET,
  NotificationChannels.PREFERENCES_UPDATE,
  NotificationChannels.CUSTOM_RECEIVE,
  NotificationChannels.CUSTOM_CLICK,
  NotificationChannels.CUSTOM_CLOSE,
  NotificationChannels.CUSTOM_RESIZE,
  NotificationChannels.CUSTOM_MOUSE_ENTER,
  NotificationChannels.CUSTOM_MOUSE_LEAVE,
  NotificationChannels.CUSTOM_RENDERER_READY,
] as const;
let activeNotificationModule: NotificationModuleInstance | null = null;

export function getNotificationRepository(): INotificationRepository {
  if (!activeNotificationModule) {
    throw new Error('Notification module not registered yet');
  }

  return activeNotificationModule.notificationRepository;
}

export function createNotificationPowerSyncScheduleNotificationPort(
  db: IElectronModuleContext['db'],
): ScheduleNotificationPort {
  const createNotification = new CreateNotificationUseCase(
    new PowerSyncNotificationRepository(db),
    new PowerSyncNotificationTemplateRepository(db),
    new PowerSyncNotificationPreferenceRepository(db),
  );

  return {
    createNotification(request) {
      return createNotification.execute({
        ...request,
        channels: request.channels ? Array.from(request.channels) : undefined,
      });
    },
  };
}

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

    const controller = new NotificationController(notificationModule.api);

    // 2. IPC Handlers — preserve all existing channels.
    // IPC 处理器 — 保留所有现有通道。
    ipcMain.handle(NotificationChannels.LIST, async (_, params) => {
      return withAuthenticatedValue(ctx, (requestContext) =>
        controller.list({
          ...(params ?? {}),
        }, requestContext),
      );
    });
    ipcMain.handle(NotificationChannels.GET, (_, id) =>
      withAuthenticatedValue(ctx, (requestContext) => controller.get(id, requestContext)),
    );
    ipcMain.handle(NotificationChannels.CREATE, async (_, dto) =>
      withAuthenticatedValue(ctx, (requestContext) => controller.create(dto, requestContext)),
    );
    ipcMain.handle(NotificationChannels.MARK_READ, (_, id) =>
      withAuthenticatedValue(ctx, (requestContext) => controller.markAsRead(id, requestContext)),
    );
    ipcMain.handle(NotificationChannels.MARK_ALL_READ, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) => controller.markAllAsRead(identityId));
    });
    ipcMain.handle(NotificationChannels.DELETE, async (_, id) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await controller.delete(id, requestContext);
        if (!result.ok) return result;
        return ok(null);
      }),
    );
    ipcMain.handle(NotificationChannels.CLEAR_ALL, async (_, ids) => {
      if (Array.isArray(ids) && ids.length > 0) {
        return withAuthenticatedValue(ctx, (requestContext) =>
          controller.batchDelete({ notificationIds: ids }, requestContext),
        );
      }
      return fail({ code: 'VALIDATION_ERROR', message: 'notification ids are required' });
    });
    ipcMain.handle(NotificationChannels.GET_UNREAD_COUNT, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) => controller.getUnreadCount(identityId));
    });
    ipcMain.handle(NotificationChannels.PREFERENCES_GET, async () => {
      return withAuthenticatedValue(ctx, (requestContext) =>
        controller.getPreferences(requestContext),
      );
    });
    ipcMain.handle(NotificationChannels.PREFERENCES_UPDATE, async (_, dto) => {
      return withAuthenticatedValue(ctx, (requestContext) =>
        controller.updatePreferences(dto ?? {}, requestContext),
      );
    });
    logger.info('Notification module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeNotificationModule?.dispose();
    activeNotificationModule = null;
    logger.info('Notification module destroyed');
  },
};
