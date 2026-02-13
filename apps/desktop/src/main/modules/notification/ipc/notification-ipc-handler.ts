/**
 * Notification IPC 处理器
 * 处理所有与通知相关的 IPC 请求
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
    ipcMain.handle('notification:create', async (event, input: CreateNotificationRequest) => {
      return this.handleRequest(
        'notification:create',
        () => this.notificationService.create(input),
        { accountUuid: input.accountUuid },
      );
    });

    // 获取通知
    ipcMain.handle('notification:get', async (event, payload: { uuid: string; includeChildren?: boolean }) => {
      return this.handleRequest(
        'notification:get',
        () => this.notificationService.get(payload.uuid, payload.includeChildren),
      );
    });

    // 列出通知
    ipcMain.handle('notification:list', async (event, payload: { accountUuid: string; options?: { includeRead?: boolean; limit?: number; offset?: number } }) => {
      return this.handleRequest(
        'notification:list',
        () => this.notificationService.list(payload.accountUuid, payload.options),
        { accountUuid: payload.accountUuid },
      );
    });

    // 列出未读通知
    ipcMain.handle('notification:list-unread', async (event, payload: { accountUuid: string; limit?: number }) => {
      return this.handleRequest(
        'notification:list-unread',
        () => this.notificationService.listUnread(payload.accountUuid, payload.limit),
        { accountUuid: payload.accountUuid },
      );
    });

    // 获取未读数量
    ipcMain.handle('notification:get-unread-count', async (event, accountUuid: string) => {
      return this.handleRequest(
        'notification:get-unread-count',
        () => this.notificationService.getUnreadCount(accountUuid),
        { accountUuid },
      );
    });

    // 标记已读
    ipcMain.handle('notification:mark-as-read', async (event, uuid: string) => {
      return this.handleRequest(
        'notification:mark-as-read',
        () => this.notificationService.markAsRead(uuid),
      );
    });

    // 标记所有已读
    ipcMain.handle('notification:mark-all-as-read', async (event, accountUuid: string) => {
      return this.handleRequest(
        'notification:mark-all-as-read',
        () => this.notificationService.markAllAsRead(accountUuid),
        { accountUuid },
      );
    });

    // 删除通知
    ipcMain.handle('notification:delete', async (event, payload: { uuid: string; soft?: boolean }) => {
      return this.handleRequest(
        'notification:delete',
        () => this.notificationService.delete(payload.uuid, payload.soft),
      );
    });

    // 获取通知偏好
    ipcMain.handle('notification:get-preference', async (event, accountUuid: string) => {
      return this.handleRequest(
        'notification:get-preference',
        () => this.notificationService.getPreference(accountUuid),
        { accountUuid },
      );
    });

    // 获取或创建通知偏好
    ipcMain.handle('notification:get-or-create-preference', async (event, accountUuid: string) => {
      return this.handleRequest(
        'notification:get-or-create-preference',
        () => this.notificationService.getOrCreatePreference(accountUuid),
        { accountUuid },
      );
    });

    // 更新通知偏好
    ipcMain.handle('notification:update-preference', async (event, payload: { accountUuid: string; updates: any }) => {
      return this.handleRequest(
        'notification:update-preference',
        () => this.notificationService.updatePreference(payload.accountUuid, payload.updates),
        { accountUuid: payload.accountUuid },
      );
    });

    this.logger.info('Registered Notification IPC handlers');
  }
}

export const notificationIPCHandler = new NotificationIPCHandler();
