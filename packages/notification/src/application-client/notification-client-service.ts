/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Notification Client Service
 *
 * Constructor-injected application service for notification management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/notification-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';
import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../infrastructure-client/adapters/types';

export class NotificationClientService {
  constructor(
    private readonly notificationApi: INotificationApiClient,
  ) {}

  // ===== Notification Operations =====

  async createNotification(request: CreateNotificationRequest): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.createNotification(request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<Result<NotificationListResponse>> {
    return this.notificationApi.findNotifications(query);
  }

  async findNotificationById(id: string): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.findNotificationById(id);
  }

  async markAsRead(id: string): Promise<Result<NotificationClientDTO>> {
    return this.notificationApi.markAsRead(id);
  }

  async markAllAsRead(): Promise<Result<CountResult>> {
    return this.notificationApi.markAllAsRead();
  }

  async deleteNotification(id: string): Promise<Result<ActionResult>> {
    return this.notificationApi.deleteNotification(id);
  }

  async batchDeleteNotifications(ids: string[]): Promise<Result<CountResult>> {
    return this.notificationApi.batchDeleteNotifications(ids);
  }

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    return this.notificationApi.getUnreadCount();
  }
}
