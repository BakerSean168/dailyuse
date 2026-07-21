import type { Result } from '@dailyuse/contracts/result';

export interface NotificationApplicationPort {
  createNotification(data: unknown): Promise<Result<unknown>>;
  listNotifications(query: unknown): Promise<Result<unknown>>;
  getNotification(id: string, identityId: string): Promise<Result<unknown>>;
  updateNotification(id: string, identityId: string, data: unknown): Promise<Result<unknown>>;
  deleteNotification(id: string, identityId: string): Promise<Result<unknown>>;
  markAsRead(id: string, identityId: string): Promise<Result<unknown>>;
  markAllAsRead(identityId: string): Promise<Result<unknown>>;
  getUnreadCount(identityId: string): Promise<Result<unknown>>;
  batchMarkAsRead(
    data: { notificationIds?: string[] },
    identityId: string,
  ): Promise<Result<unknown>>;
  batchDelete(
    data: { notificationIds?: string[] },
    identityId: string,
  ): Promise<Result<unknown>>;
  cleanupOldNotifications(data: {
    identityId: string;
    beforeDays?: number;
    category?: string;
  }): Promise<Result<unknown>>;
  getPreferences(identityId: string): Promise<Result<unknown>>;
  updatePreferences(dto: unknown): Promise<Result<unknown>>;
}
