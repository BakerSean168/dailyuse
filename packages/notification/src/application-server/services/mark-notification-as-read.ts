/**
 * Mark Notification As Read Service
 *
 * 标记通知为已读的应用服务
 */

import type {
  INotificationRepository,
} from '../../domain-server/repositories';

/**
 * Mark Notification As Read Service
 */
export class MarkNotificationAsRead {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(uuid: string): Promise<void> {
    const notification = await this.notificationRepository.findById(uuid);
    if (!notification) {
      throw new Error(`Notification not found: ${uuid}`);
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);
  }

  async executeMany(uuids: string[]): Promise<void> {
    await this.notificationRepository.markManyAsRead(uuids);
  }

  async executeAll(accountUuid: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(accountUuid);
  }
}
