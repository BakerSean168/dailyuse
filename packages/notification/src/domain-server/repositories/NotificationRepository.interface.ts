/**
 * NotificationRepository 鎺ュ彛瀹氫箟
 * 閫氱煡浠撳偍鎺ュ彛
 */

import type { Notification } from '../aggregates/notification';

export interface NotificationRepository {
  /**
   * 淇濆瓨閫氱煡
   */
  save(notification: Notification): Promise<void>;

  /**
   * 鏍规嵁 UUID 鏌ユ壘閫氱煡
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * 鏍规嵁鐢ㄦ埛 UUID 鏌ユ壘閫氱煡鍒楄〃
   */
  findByIdentityId(
    identityId: string,
    options?: FindNotificationsOptions
  ): Promise<{ notifications: Notification[]; total: number }>;

  /**
   * 鑾峰彇鏈鏁伴噺
   */
  countUnread(identityId: string): Promise<number>;

  /**
   * 鎵归噺鏍囪宸茶
   */
  markAllAsRead(identityId: string): Promise<number>;

  /**
   * 鎵归噺鍒犻櫎
   */
  deleteMany(ids: string[]): Promise<number>;

  /**
   * 鍒犻櫎閫氱煡
   */
  delete(id: string): Promise<void>;
}

export interface FindNotificationsOptions {
  page?: number;
  limit?: number;
  status?: 'READ' | 'UNREAD' | 'ALL';
  type?: string;
  sortBy?: 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
