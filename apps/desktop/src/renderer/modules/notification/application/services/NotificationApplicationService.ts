/**
 * Notification Application Service - Renderer
 *
 * 通知模块应用服务层
 * 封装 @dailyuse/application-client 的 Notification Use Cases
 */

import {
  CreateNotification,
  FindNotifications,
  FindNotificationByUuid,
  MarkAsRead,
  MarkAllAsRead,
  DeleteNotification,
  BatchDeleteNotifications,
  GetUnreadCount,
} from '@dailyuse/application-client';
import type {
  NotificationListResponse,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  UnreadCountResponse,
} from '@dailyuse/infrastructure-client';

/** Find notifications input type alias */
type FindNotificationsInput = QueryNotificationsRequest;

/** Mark all as read output type */
type MarkAllAsReadOutput = { success: boolean; count: number };

/** Delete notification output type */
type DeleteNotificationOutput = { success: boolean };

/** Batch delete notifications output type */
type BatchDeleteNotificationsOutput = { success: boolean; count: number };

/** Get unread count output type alias */
type GetUnreadCountOutput = UnreadCountResponse;
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

/**
 * 通知应用服务
 *
 * 提供通知相关的所有业务操作
 */
export class NotificationApplicationService {
  /**
   * 创建通知
   */
  async createNotification(input: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return CreateNotification.getInstance().execute(input);
  }

  /**
   * 查找通知列表
   */
  async findNotifications(input?: FindNotificationsInput): Promise<NotificationListResponse> {
    return FindNotifications.getInstance().execute(input);
  }

  /**
   * 根据 UUID 查找通知
   */
  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO | null> {
    return FindNotificationByUuid.getInstance().execute(uuid);
  }

  /**
   * 标记为已读
   */
  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return MarkAsRead.getInstance().execute(uuid);
  }

  /**
   * 标记全部为已读
   */
  async markAllAsRead(): Promise<MarkAllAsReadOutput> {
    return MarkAllAsRead.getInstance().execute();
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string): Promise<DeleteNotificationOutput> {
    return DeleteNotification.getInstance().execute(uuid);
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(uuids: string[]): Promise<BatchDeleteNotificationsOutput> {
    return BatchDeleteNotifications.getInstance().execute(uuids);
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<GetUnreadCountOutput> {
    return GetUnreadCount.getInstance().execute();
  }
}

/**
 * 通知应用服务单例
 */
export const notificationApplicationService = new NotificationApplicationService();
