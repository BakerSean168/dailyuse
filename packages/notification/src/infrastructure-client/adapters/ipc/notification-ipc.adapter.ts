/**
 * Notification IPC Adapter
 *
 * IPC implementation of INotificationApiClient for Electron desktop apps.
 */

import type {
  IIpcClient,
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
  FIND_ALL: 'notification:find-all',
  FIND_BY_UUID: 'notification:find-by-uuid',
  MARK_AS_READ: 'notification:mark-read',
  MARK_ALL_AS_READ: 'notification:mark-all-read',
  DELETE: 'notification:delete',
  BATCH_DELETE: 'notification:batch-delete',
  GET_UNREAD_COUNT: 'notification:unread-count',
} as const;

export class NotificationIpcAdapter implements INotificationApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  async createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.CREATE, request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<NotificationListResponse> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.FIND_ALL, query);
  }

  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.FIND_BY_UUID, uuid);
  }

  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.MARK_AS_READ, uuid);
  }

  async markAllAsRead(): Promise<CountResult> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.MARK_ALL_AS_READ);
  }

  async deleteNotification(uuid: string): Promise<ActionResult> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.DELETE, uuid);
  }

  async batchDeleteNotifications(uuids: string[]): Promise<CountResult> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.BATCH_DELETE, uuids);
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.ipcClient.invoke(NOTIFICATION_CHANNELS.GET_UNREAD_COUNT);
  }
}

/**
 * Factory function to create NotificationIpcAdapter
 */
export function createNotificationIpcAdapter(ipcClient: IIpcClient): NotificationIpcAdapter {
  return new NotificationIpcAdapter(ipcClient);
}
