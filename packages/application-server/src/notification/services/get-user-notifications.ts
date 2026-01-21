/**
 * Get User Notifications Service
 *
 * 获取用户通知的应用服务
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
 * Get User Notifications Service
 */
export class GetUserNotifications {
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
  static getInstance(): GetUserNotifications {
    if (!GetUserNotifications.instance) {
      GetUserNotifications.instance = GetUserNotifications.createInstance();
    }
    return GetUserNotifications.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUserNotifications.instance = undefined as unknown as GetUserNotifications;
  }

  async execute(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUserNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }
}

/**
 * 便捷函数：获取用户通知
 */
export const getUserNotifications = (
  accountUuid: string,
  options?: { includeRead?: boolean; limit?: number; offset?: number },
): Promise<NotificationClientDTO[]> =>
  GetUserNotifications.getInstance().execute(accountUuid, options);
