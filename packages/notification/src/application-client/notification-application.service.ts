/**
 * Notification Application Service
 * @module application-client/notification
 */
import { GetNotifications, MarkAsRead, DeleteNotification, ClearNotifications } from './services';

export class NotificationApplicationService {
  async getNotifications(): Promise<any[]> {
    return GetNotifications.getInstance().execute();
  }
  async markAsRead(uuid: string): Promise<void> {
    return MarkAsRead.getInstance().execute(uuid);
  }
  async deleteNotification(uuid: string): Promise<void> {
    return DeleteNotification.getInstance().execute(uuid);
  }
  async clearNotifications(): Promise<void> {
    return ClearNotifications.getInstance().execute();
  }
}

export const notificationApplicationService = new NotificationApplicationService();
