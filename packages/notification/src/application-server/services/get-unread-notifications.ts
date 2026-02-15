/**
 * Get Unread Notifications Service
 *
 * 获取未读通知的应用服务
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationRepository,
} from '../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

/**
 * Get Unread Notifications Service
 */
export class GetUnreadNotifications {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.notificationRepository.findUnread(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getCount(accountUuid: string): Promise<number> {
    return this.notificationRepository.countUnread(accountUuid);
  }
}
