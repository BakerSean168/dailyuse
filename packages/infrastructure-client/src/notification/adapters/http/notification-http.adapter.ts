/**
 * Notification HTTP Adapter
 *
 * HTTP implementation of INotificationApiClient.
 */

import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '../../ports/notification-api-client.port';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { IHttpClient } from '../../../shared/http-client.types';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

/**
 * NotificationHttpAdapter
 *
 * HTTP 实现的通知 API 客户端
 */
export class NotificationHttpAdapter implements INotificationApiClient {
  private readonly baseUrl = '/api/v1/notifications';

  constructor(private readonly httpClient: IHttpClient) {}

  async createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async findNotifications(query?: QueryNotificationsRequest): Promise<NotificationListResponse> {
    return this.httpClient.get(this.baseUrl, {
      params: query as unknown as Record<string, unknown>,
    });
  }

  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}/read`);
  }

  async markAllAsRead(): Promise<CountResult> {
    return this.httpClient.patch(`${this.baseUrl}/read-all`);
  }

  async deleteNotification(uuid: string): Promise<ActionResult> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  async batchDeleteNotifications(uuids: string[]): Promise<CountResult> {
    return this.httpClient.post(`${this.baseUrl}/batch-delete`, { uuids });
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.httpClient.get(`${this.baseUrl}/unread-count`);
  }
}

/**
 * Factory function to create NotificationHttpAdapter
 */
export function createNotificationHttpAdapter(httpClient: IHttpClient): NotificationHttpAdapter {
  return new NotificationHttpAdapter(httpClient);
}
