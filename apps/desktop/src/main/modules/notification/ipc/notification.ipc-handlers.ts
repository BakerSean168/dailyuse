/**
 * Notification IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 * IPC 通道：通知 CRUD 和状态管理
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { NotificationDesktopApplicationService } from '../application/NotificationDesktopApplicationService';
import type { CreateNotificationRequest } from '@dailyuse/contracts/notification';

export class NotificationIPCHandler extends BaseIPCHandler {
  private notificationService: NotificationDesktopApplicationService;

  constructor() {
    super('NotificationIPCHandler');
    this.notificationService = new NotificationDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建通知
    ipcMain.handle('notification:create', async (_, input: CreateNotificationRequest) => {
      return this.handleRequest(
        'notification:create',
        () => this.notificationService.create(input),
      );
    });

    // 获取单个通知
    ipcMain.handle('notification:get', async (_, uuid: string, includeChildren?: boolean) => {
      return this.handleRequest('notification:get', () =>
        this.notificationService.get(uuid, includeChildren),
      );
    });

    // 列出通知
    ipcMain.handle(
      'notification:list',
      async (
        _,
        accountUuid: string,
        options?: { includeRead?: boolean; limit?: number; offset?: number },
      ) => {
        return this.handleRequest('notification:list', () =>
          this.notificationService.list(accountUuid, options),
        );
      },
    );

    // 列出未读通知
    ipcMain.handle(
      'notification:listUnread',
      async (_, accountUuid: string, limit?: number) => {
        return this.handleRequest('notification:listUnread', () =>
          this.notificationService.listUnread(accountUuid, limit),
        );
      },
    );

    // 获取未读数量
    ipcMain.handle('notification:getUnreadCount', async (_, accountUuid: string) => {
      return this.handleRequest('notification:getUnreadCount', () =>
        this.notificationService.getUnreadCount(accountUuid),
      );
    });

    // 标记为已读
    ipcMain.handle('notification:markAsRead', async (_, uuid: string) => {
      return this.handleRequest('notification:markAsRead', () =>
        this.notificationService.markAsRead(uuid),
      );
    });

    // 标记全部已读
    ipcMain.handle(
      'notification:markAllAsRead',
      async (_, accountUuid: string) => {
        return this.handleRequest('notification:markAllAsRead', () =>
          this.notificationService.markAllAsRead(accountUuid),
        );
      },
    );

    // 删除通知
    ipcMain.handle('notification:delete', async (_, uuid: string, soft?: boolean) => {
      return this.handleRequest('notification:delete', () =>
        this.notificationService.delete(uuid, soft ?? true),
      );
    });

    // 获取偏好设置
    ipcMain.handle('notification:preference:get', async (_, accountUuid: string) => {
      return this.handleRequest('notification:preference:get', () =>
        this.notificationService.getPreference(accountUuid),
      );
    });

    // 获取或创建偏好设置
    ipcMain.handle(
      'notification:preference:getOrCreate',
      async (_, accountUuid: string) => {
        return this.handleRequest('notification:preference:getOrCreate', () =>
          this.notificationService.getOrCreatePreference(accountUuid),
        );
      },
    );

    // 更新偏好设置
    ipcMain.handle(
      'notification:preference:update',
      async (_, accountUuid: string, updates: any) => {
        return this.handleRequest('notification:preference:update', () =>
          this.notificationService.updatePreference(accountUuid, updates),
        );
      },
    );

    // 获取统计摘要
    ipcMain.handle(
      'notification:statistics:summary',
      async (_, accountUuid: string) => {
        return this.handleRequest('notification:statistics:summary', () =>
          this.notificationService.getStatisticsSummary(accountUuid),
        );
      },
    );
  }
}

/**
 * 注册通知 IPC 通道（已弃用）
 *
 * @deprecated 使用 NotificationIPCHandler 类代替
 */
export function registerNotificationIpcHandlers(): void {
  const handler = new NotificationIPCHandler();
  (global as any).notificationIPCHandler = handler;
}

/**
 * 注销通知 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterNotificationIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
