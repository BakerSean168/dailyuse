/**
 * NotificationApiClient
 * 通知 API 客户端
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';
import { createAxiosInstance } from '@dailyuse/http-client';
import type {
  CreateNotificationRequest,
  NotificationListResponse,
  QueryNotificationsRequest,
  UnreadCountResponse,
} from '../../../infrastructure-client/adapters/types';

type BatchDeleteNotificationsRequest = {
  ids: string[];
};

const apiClient = createAxiosInstance({ baseURL: '/api/v1' });

export class NotificationApiClient {
  private readonly baseUrl = '/notifications';

  /**
   * 创建通知
   */
  async createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO> {
    const response = await apiClient.post<NotificationClientDTO>(this.baseUrl, request);
    return response.data;
  }

  /**
   * 查询通知列表
   */
  async findNotifications(
    query: QueryNotificationsRequest = {},
  ): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>(this.baseUrl, {
      params: query,
    });
    return response.data;
  }

  /**
   * 根据 UUID 查询通知
   */
  async findNotificationById(id: string): Promise<NotificationClientDTO> {
    const response = await apiClient.get<NotificationClientDTO>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(id: string): Promise<NotificationClientDTO> {
    const response = await apiClient.patch<NotificationClientDTO>(`${this.baseUrl}/${id}/read`);
    return response.data;
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<CountResult> {
    const response = await apiClient.patch<CountResult>(`${this.baseUrl}/read-all`);
    return response.data;
  }

  /**
   * 删除通知
   */
  async deleteNotification(id: string): Promise<ActionResult> {
    const response = await apiClient.delete<ActionResult>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(ids: string[]): Promise<CountResult> {
    const response = await apiClient.delete<CountResult>(this.baseUrl, {
      data: { ids } as BatchDeleteNotificationsRequest,
    });
    return response.data;
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`);
    return response.data;
  }
}

// 导出单例
export const notificationApiClient = new NotificationApiClient();
