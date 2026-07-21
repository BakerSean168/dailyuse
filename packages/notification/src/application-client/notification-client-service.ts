/**
 * Notification Client Service
 *
 * Constructor-injected application service for notification management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/notification-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import type { BatchOperationResultDTO, NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from './ports/notification-api-client.port';

// ─── Client Application Port ────────────────────────────────────────────────

/** High-level client-side operations for the notification module. */
export interface NotificationClientPort {
  createNotification(request: CreateNotificationRequest): Promise<Result<NotificationClientDTO>>;
  findNotifications(query?: QueryNotificationsRequest): Promise<Result<NotificationListResponse>>;
  findNotificationById(id: string): Promise<Result<NotificationClientDTO>>;
  markAsRead(id: string): Promise<Result<NotificationClientDTO>>;
  markAllAsRead(): Promise<Result<{ count: number }>>;
  deleteNotification(id: string): Promise<Result<null>>;
  batchDeleteNotifications(ids: string[]): Promise<Result<BatchOperationResultDTO>>;
  dismissAll(ids: string[]): Promise<Result<BatchOperationResultDTO>>;
  getUnreadCount(): Promise<Result<UnreadCountResponse>>;
}

export class NotificationClientService implements NotificationClientPort {
  constructor(private readonly notificationApi: INotificationApiClient) {
    this.createNotification = this.createNotification.bind(this);
    this.findNotifications = this.findNotifications.bind(this);
    this.findNotificationById = this.findNotificationById.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.batchDeleteNotifications = this.batchDeleteNotifications.bind(this);
    this.dismissAll = this.dismissAll.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
  }

  // ===== Notification Operations =====

  async createNotification(
    request: CreateNotificationRequest,
  ): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.createNotification(request);
  }

  async findNotifications(
    query?: QueryNotificationsRequest,
  ): Promise<Result<NotificationListResponse>> {
    return this.notificationApi.findNotifications(query);
  }

  async findNotificationById(id: string): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.findNotificationById(id);
  }

  async markAsRead(id: string): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.markAsRead(id);
  }

  async markAllAsRead(): Promise<Result<{ count: number }>> {
    return this.notificationApi.markAllAsRead();
  }

  async deleteNotification(id: string): Promise<Result<null>> {
    return this.notificationApi.deleteNotification(id);
  }

  async batchDeleteNotifications(ids: string[]): Promise<Result<BatchOperationResultDTO>> {
    return this.notificationApi.batchDeleteNotifications(ids);
  }

  async dismissAll(ids: string[]): Promise<Result<BatchOperationResultDTO>> {
    return this.notificationApi.batchDeleteNotifications(ids);
  }

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    return this.notificationApi.getUnreadCount();
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create a `NotificationClientService` from any transport adapter. */
export function createNotificationClientService(
  apiClient: INotificationApiClient,
): NotificationClientService {
  return new NotificationClientService(apiClient);
}
