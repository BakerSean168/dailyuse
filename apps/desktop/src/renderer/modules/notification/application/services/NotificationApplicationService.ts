/**
 * Notification Application Service - Renderer
 *
 * 通知模块应用服务层
 * 封装 @dailyuse/application-client 的 Notification Use Cases
 * application-client 已返回 Entity 对象，直接透传即可
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
  type FindNotificationsOutput,
} from '@dailyuse/application-client';
import type {
  CreateNotificationRequest,
  QueryNotificationsRequest,
  UnreadCountResponse,
} from '@dailyuse/infrastructure-client';
import type { NotificationClient } from '@dailyuse/domain-client/notification';

/** Find notifications input type alias */
type FindNotificationsInput = QueryNotificationsRequest;

/** Notification list response with Entity objects - re-export from application-client */
export type NotificationListResponse = FindNotificationsOutput;

/** Mark all as read output type */
type MarkAllAsReadOutput = { success: boolean; count: number };

/** Delete notification output type */
type DeleteNotificationOutput = { success: boolean };

/** Batch delete notifications output type */
type BatchDeleteNotificationsOutput = { success: boolean; count: number };

/** Get unread count output type alias */
type GetUnreadCountOutput = UnreadCountResponse;

/**
 * 通知应用服务
 *
 * 提供通知相关的所有业务操作
 * application-client 已返回 Entity 对象，直接透传
 */
export class NotificationApplicationService {
  /**
   * 创建通知
   * @returns NotificationClient Entity
   */
  async createNotification(input: CreateNotificationRequest): Promise<NotificationClient> {
    return CreateNotification.getInstance().execute(input);
  }

  /**
   * 查找通知列表
   * @returns 包含 NotificationClient Entity 数组的响应
   */
  async findNotifications(input?: FindNotificationsInput): Promise<NotificationListResponse> {
    return FindNotifications.getInstance().execute(input);
  }

  /**
   * 根据 UUID 查找通知
   * @returns NotificationClient Entity 或 null
   */
  async findNotificationByUuid(uuid: string): Promise<NotificationClient> {
    return FindNotificationByUuid.getInstance().execute(uuid);
  }

  /**
   * 标记为已读
   * @returns 更新后的 NotificationClient Entity
   */
  async markAsRead(uuid: string): Promise<NotificationClient> {
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
