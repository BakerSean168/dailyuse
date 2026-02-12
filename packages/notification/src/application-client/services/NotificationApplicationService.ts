/**
 * Notification Application Service
 * 通知应用服务 - 负责通知的 CRUD 操作
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 */

// @ts-nocheck - Some types not yet defined in contracts
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { notificationApiClient } from '../../infrastructure/api/notificationApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationApplicationService');

export interface QueryNotificationsRequest {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export interface NotificationListResponse {
  notifications: NotificationClientDTO[];
  total: number;
  unreadCount: number;
}

export class NotificationApplicationService {
  private static instance: NotificationApplicationService;

  private constructor() {}

  static getInstance(): NotificationApplicationService {
    if (!NotificationApplicationService.instance) {
      NotificationApplicationService.instance = new NotificationApplicationService();
    }
    return NotificationApplicationService.instance;
  }

  /**
   * 查询通知列表
   */
  async findNotifications(query: QueryNotificationsRequest = {}): Promise<NotificationListResponse> {
    logger.info('Finding notifications', query);
    const response = await notificationApiClient.findNotifications(query);
    logger.info('Notifications found', { total: response.total });
    return response;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    logger.info('Marking notification as read', { uuid });
    const notification = await notificationApiClient.markAsRead(uuid);
    logger.info('Notification marked as read', { uuid });
    return notification;
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    logger.info('Marking all notifications as read');
    const result = await notificationApiClient.markAllAsRead();
    logger.info('All notifications marked as read', { count: result.count });
    return result;
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string): Promise<void> {
    logger.info('Deleting notification', { uuid });
    await notificationApiClient.deleteNotification(uuid);
    logger.info('Notification deleted', { uuid });
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(uuids: string[]): Promise<{ success: boolean; count: number }> {
    logger.info('Batch deleting notifications', { count: uuids.length });
    const result = await notificationApiClient.batchDeleteNotifications(uuids);
    logger.info('Notifications batch deleted', { count: result.count });
    return result;
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<{ count: number }> {
    logger.info('Getting unread count');
    const result = await notificationApiClient.getUnreadCount();
    logger.info('Unread count fetched', { count: result.count });
    return result;
  }
}

export const notificationApplicationService = NotificationApplicationService.getInstance();
