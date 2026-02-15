/**
 * Get User Notifications Service
 *
 * 获取用户通知的应用服务
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationRepository,
} from '../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

/**
 * Get User Notifications Service
 */
export class GetUserNotifications {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.notificationRepository.findByAccountUuid(accountUuid, {
      includeRead: options?.includeRead ?? true,
      includeDeleted: false,
      limit: options?.limit,
      offset: options?.offset,
    });
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }
}
