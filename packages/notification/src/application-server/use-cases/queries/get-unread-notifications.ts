/**
 * Get Unread Notifications Service
 *
 * 获取未读通知的应用服务
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationRepository,
} from '../../../domain-server/repositories';
import { toNotificationClientDTO } from '../commands/notification-dto-converters';

/**
 * Get Unread Notifications Service
 */
export class GetUnreadNotifications {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    identityId: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.notificationRepository.findUnread(identityId, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getCount(identityId: string): Promise<number> {
    return this.notificationRepository.countUnread(identityId);
  }
}
