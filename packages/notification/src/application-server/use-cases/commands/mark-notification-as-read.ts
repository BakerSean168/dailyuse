/**
 * Mark Notification As Read Service
 *
 * 标记通知为已读的应用服务
 */

import type {
  INotificationRepository,
} from '../../../domain-server/repositories';

/**
 * Mark Notification As Read Service
 */
export class MarkNotificationAsRead {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new Error(`Notification not found: ${id}`);
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);
  }

  async executeMany(ids: string[]): Promise<void> {
    const notifications = (
      await Promise.all(ids.map((id) => this.notificationRepository.findById(id)))
    ).filter((notification): notification is NonNullable<typeof notification> => notification !== null);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepository.saveMany(notifications);
  }

  async executeAll(identityId: string): Promise<void> {
    const notifications = await this.notificationRepository.findUnread(identityId);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepository.saveMany(notifications);
  }
}
