/**
 * Mark Notification As Read Service
 *
 * 标记通知为已读的应用服务
 */

import { NotificationDomainService } from '@dailyuse/domain-server/notification';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';

/**
 * Mark Notification As Read Service
 */
export class MarkNotificationAsRead {
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

  async execute(uuid: string): Promise<void> {
    await this.domainService.markAsRead(uuid);
  }

  async executeMany(uuids: string[]): Promise<void> {
    await this.domainService.markManyAsRead(uuids);
  }

  async executeAll(accountUuid: string): Promise<void> {
    await this.domainService.markAllAsRead(accountUuid);
  }
}
