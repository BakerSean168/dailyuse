/**
 * Get Unread Notifications Service
 *
 * 获取未读通知的应用服务
 */

import { NotificationDomainService } from '@dailyuse/domain-server/notification';
import type {
  NotificationClientDTO,
} from '@dailyuse/contracts/notification';
import type {
  NotificationRepository as INotificationRepository,
  NotificationRepository as INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
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

  /**
   * 获取服务单例
   */
  static getInstance(): GetUnreadNotifications {
    if (!GetUnreadNotifications.instance) {
      GetUnreadNotifications.instance = GetUnreadNotifications.createInstance();
    }
    return GetUnreadNotifications.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUnreadNotifications.instance = undefined as unknown as GetUnreadNotifications;
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

/**
 * 便捷函数：获取未读通知
 */
export const getUnreadNotifications = (
  accountUuid: string,
  options?: { limit?: number },
): Promise<NotificationClientDTO[]> =>
  GetUnreadNotifications.getInstance().execute(accountUuid, options);

export const getUnreadNotificationCount = (accountUuid: string): Promise<number> =>
  GetUnreadNotifications.getInstance().getCount(accountUuid);
