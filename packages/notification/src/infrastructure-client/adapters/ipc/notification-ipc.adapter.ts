/**
 * Notification IPC Adapter
 *
 * IPC implementation of INotificationApiClient for Electron desktop apps.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  IResultIpcClient,
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

/**
 * IPC channel definitions for Notification operations
 */
const NOTIFICATION_CHANNELS = {
  CREATE: 'notification:create',
  LIST: 'notification:list',
  GET: 'notification:get',
  MARK_AS_READ: 'notification:mark-read',
  MARK_ALL_AS_READ: 'notification:mark-all-read',
  DELETE: 'notification:delete',
  CLEAR_ALL: 'notification:clear-all',
  GET_UNREAD_COUNT: 'notification:unread-count',
} as const;

export class NotificationIpcAdapter implements INotificationApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createNotification(request: CreateNotificationRequest): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.CREATE, request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<Result<NotificationListResponse>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.LIST, query);
  }

  async findNotificationById(id: string): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.GET, id);
  }

  async markAsRead(id: string): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.MARK_AS_READ, id);
  }

  async markAllAsRead(): Promise<Result<CountResult>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.MARK_ALL_AS_READ);
  }

  async deleteNotification(id: string): Promise<Result<ActionResult>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.DELETE, id);
  }

  async batchDeleteNotifications(ids: string[]): Promise<Result<CountResult>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.CLEAR_ALL, ids);
  }

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.GET_UNREAD_COUNT);
  }
}

export function createNotificationIpcAdapter(ipcClient: IResultIpcClient): NotificationIpcAdapter {
  return new NotificationIpcAdapter(ipcClient);
}
