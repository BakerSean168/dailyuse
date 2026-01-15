/**
 * Notification IPC Adapter
 *
 * IPC implementation of INotificationApiClient for Electron desktop apps.
 */

import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../../ports/notification-api-client.port';
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

/**
 * IPC API interface for Electron renderer process
 */
interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * NotificationIpcAdapter
 *
 * IPC 实现的通知 API 客户端（用于 Electron 桌面应用）
 */
export class NotificationIpcAdapter implements INotificationApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  async createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.CREATE, request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<NotificationListResponse> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.FIND_ALL, query);
  }

  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.FIND_BY_UUID, uuid);
  }

  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.MARK_AS_READ, uuid);
  }

  async markAllAsRead(): Promise<CountResult> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.MARK_ALL_AS_READ);
  }

  async deleteNotification(uuid: string): Promise<ActionResult> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.DELETE, uuid);
  }

  async batchDeleteNotifications(uuids: string[]): Promise<CountResult> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.BATCH_DELETE, uuids);
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.ipcApi.invoke(NOTIFICATION_CHANNELS.GET_UNREAD_COUNT);
  }
}

/**
 * Factory function to create NotificationIpcAdapter
 */
export function createNotificationIpcAdapter(ipcApi: IpcApi): NotificationIpcAdapter {
  return new NotificationIpcAdapter(ipcApi);
}
