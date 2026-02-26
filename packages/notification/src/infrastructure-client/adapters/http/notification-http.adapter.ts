/**
 * Notification HTTP Adapter
 *
 * HTTP implementation of INotificationApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

/**
 * NotificationHttpAdapter
 *
 * HTTP 实现的通知 API 客户端
 */
export class NotificationHttpAdapter implements INotificationApiClient {
  private readonly baseUrl = '/notifications';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async createNotification(
    request: CreateNotificationRequest,
  ): Promise<Result<NotificationClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async findNotifications(
    query?: QueryNotificationsRequest,
  ): Promise<Result<NotificationListResponse>> {
    return this.httpClient.get(this.baseUrl, {
      params: query as unknown as Record<string, unknown>,
    });
  }

  async findNotificationById(id: string): Promise<Result<NotificationClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async markAsRead(id: string): Promise<Result<NotificationClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/${id}/read`);
  }

  async markAllAsRead(): Promise<Result<CountResult>> {
    return this.httpClient.patch(`${this.baseUrl}/read-all`);
  }

  async deleteNotification(id: string): Promise<Result<ActionResult>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  async batchDeleteNotifications(ids: string[]): Promise<Result<CountResult>> {
    return this.httpClient.post(`${this.baseUrl}/batch-delete`, { ids });
  }

  async getUnreadCount(): Promise<Result<UnreadCountResponse>> {
    return this.httpClient.get(`${this.baseUrl}/unread-count`);
  }
}

/**
 * Factory function to create NotificationHttpAdapter
 */
export function createNotificationHttpAdapter(
  httpClient: IResultHttpClient,
): NotificationHttpAdapter {
  return new NotificationHttpAdapter(httpClient);
}
