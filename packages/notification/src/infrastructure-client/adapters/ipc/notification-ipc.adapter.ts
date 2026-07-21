/**
 * Notification IPC Adapter
 *
 * IPC implementation of INotificationApiClient for Electron desktop apps.
 */

import type { Result } from '@dailyuse/contracts/result';
import { NotificationChannels } from '@dailyuse/contracts/electron';
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

export class NotificationIpcAdapter implements INotificationApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async createNotification(request: CreateNotificationRequest): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NotificationChannels.CREATE, request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<Result<NotificationListResponse>> {
    return this.ipcClient.invoke(NotificationChannels.LIST, query);
  }

  async findNotificationById(id: string): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NotificationChannels.GET, id);
  }

  async markAsRead(id: string): Promise<Result<NotificationClientDTO>> {
    return this.ipcClient.invoke(NotificationChannels.MARK_READ, id);
  }

  async markAllAsRead(): Promise<Result<CountResult>> {
    return this.ipcClient.invoke(NotificationChannels.MARK_ALL_READ);
  }

  async deleteNotification(id: string): Promise<Result<ActionResult>> {
    return this.ipcClient.invoke(NotificationChannels.DELETE, id);
  }

  async batchDeleteNotifications(ids: string[]): Promise<Result<CountResult>> {
    return this.ipcClient.invoke(NotificationChannels.CLEAR_ALL, ids);
  }

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    return this.ipcClient.invoke(NotificationChannels.GET_UNREAD_COUNT);
  }
}

export function createNotificationIpcAdapter(ipcClient: IResultIpcClient): NotificationIpcAdapter {
  return new NotificationIpcAdapter(ipcClient);
}
