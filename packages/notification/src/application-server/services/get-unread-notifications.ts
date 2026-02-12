/**
 * Get Unread Notifications Service
 *
 * 获取未读通知的应用服务
 */

import { NotificationDomainService } from '../../domain-server/services/NotificationDomainService';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '../../domain-server/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

/**
 * Get Unread Notifications Service
 */
export class GetUnreadNotifications {
  private domainService: NotificationDomainService;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {
    this.domainService = new NotificationDomainService(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    );
  }

  async execute(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUnreadNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getCount(accountUuid: string): Promise<number> {
    return this.domainService.getUnreadCount(accountUuid);
  }
}
