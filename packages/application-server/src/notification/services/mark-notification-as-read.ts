/**
 * Mark Notification As Read Service
 *
 * 标记通知为已读的应用服务
 */

import { NotificationDomainService } from '@dailyuse/domain-server/notification';
import type {
  NotificationRepository as INotificationRepository,
  NotificationRepository as INotificationTemplateRepository,
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

  /**
   * 获取服务单例
   */
  static getInstance(): MarkNotificationAsRead {
    if (!MarkNotificationAsRead.instance) {
      MarkNotificationAsRead.instance = MarkNotificationAsRead.createInstance();
    }
    return MarkNotificationAsRead.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    MarkNotificationAsRead.instance = undefined as unknown as MarkNotificationAsRead;
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

/**
 * 便捷函数：标记通知为已读
 */
export const markNotificationAsRead = (uuid: string): Promise<void> =>
  MarkNotificationAsRead.getInstance().execute(uuid);

export const markNotificationsAsRead = (uuids: string[]): Promise<void> =>
  MarkNotificationAsRead.getInstance().executeMany(uuids);

export const markAllNotificationsAsRead = (accountUuid: string): Promise<void> =>
  MarkNotificationAsRead.getInstance().executeAll(accountUuid);
