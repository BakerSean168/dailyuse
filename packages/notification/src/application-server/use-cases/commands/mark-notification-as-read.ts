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
    await this.notificationRepository.markManyAsRead(ids);
  }

  async executeAll(identityId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(identityId);
  }
}
