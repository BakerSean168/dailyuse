/**
 * NotificationRepository 接口定义
 * 通知仓储接口
 */

import type { Notification } from '../aggregates/notification';

export interface NotificationRepository {
  /**
   * 保存通知
   */
  save(notification: Notification): Promise<void>;

  /**
   * 根据 UUID 查找通知
   */
  findByUuid(uuid: string): Promise<Notification | null>;

  /**
   * 根据用户 UUID 查找通知列表
   */
  findByAccountUuid(
    accountUuid: string,
    options?: FindNotificationsOptions
  ): Promise<{ notifications: Notification[]; total: number }>;

  /**
   * 获取未读数量
   */
  countUnread(accountUuid: string): Promise<number>;

  /**
   * 批量标记已读
   */
  markAllAsRead(accountUuid: string): Promise<number>;

  /**
   * 批量删除
   */
  deleteMany(uuids: string[]): Promise<number>;

  /**
   * 删除通知
   */
  delete(uuid: string): Promise<void>;
}

export interface FindNotificationsOptions {
  page?: number;
  limit?: number;
  status?: 'READ' | 'UNREAD' | 'ALL';
  type?: string;
  sortBy?: 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
