/**
 * Notification API Client Port Interface
 *
 * 定义通知模块的 API 客户端接口。
 */

import type {
  NotificationClientDTO,
} from '@dailyuse/contracts/notification';
import type { ActionResult, CountResult } from '@dailyuse/contracts/result';

/**
 * 创建通知请求
 */
export interface CreateNotificationRequest {
  type: string;
  title: string;
  content?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 查询通知请求
 */
export interface QueryNotificationsRequest {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * 通知列表响应
 */
export interface NotificationListResponse {
  notifications: NotificationClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 未读数量响应
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * INotificationApiClient
 *
 * 通知模块 API 客户端接口
 */
export interface INotificationApiClient {
  /**
   * 创建通知
   */
  createNotification(request: CreateNotificationRequest): Promise<NotificationClientDTO>;

  /**
   * 查询通知列表
   */
  findNotifications(query?: QueryNotificationsRequest): Promise<NotificationListResponse>;

  /**
   * 根据 UUID 查询通知
   */
  findNotificationByUuid(uuid: string): Promise<NotificationClientDTO>;

  /**
   * 标记通知为已读
   */
  markAsRead(uuid: string): Promise<NotificationClientDTO>;

  /**
   * 标记所有通知为已读
   * @returns CountResult 包含受影响的通知数量
   */
  markAllAsRead(): Promise<CountResult>;

  /**
   * 删除通知
   * @returns ActionResult 操作结果
   */
  deleteNotification(uuid: string): Promise<ActionResult>;

  /**
   * 批量删除通知
   * @returns CountResult 包含删除的通知数量
   */
  batchDeleteNotifications(uuids: string[]): Promise<CountResult>;

  /**
   * 获取未读数量
   */
  getUnreadCount(): Promise<UnreadCountResponse>;
}
