/**
 * Get Notification Preference Service
 *
 * 获取通知偏好设置的应用服务
 */

import { NotificationPreferenceDomainService } from '@dailyuse/domain-server/notification';
import type {
  NotificationPreferenceClientDTO,
} from '@dailyuse/contracts/notification';
import type {
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
import { toNotificationPreferenceClientDTO } from './notification-dto-converters';

/**
 * Get Notification Preference Service
 */
export class GetNotificationPreference {
  private preferenceService: NotificationPreferenceDomainService;

  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {
    this.preferenceService = new NotificationPreferenceDomainService(preferenceRepository);
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetNotificationPreference {
    if (!GetNotificationPreference.instance) {
      GetNotificationPreference.instance = GetNotificationPreference.createInstance();
    }
    return GetNotificationPreference.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetNotificationPreference.instance = undefined as unknown as GetNotificationPreference;
  }

  async execute(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    const preference = await this.preferenceService.getPreference(accountUuid);
    return preference ? toNotificationPreferenceClientDTO(preference.toServerDTO()) : null;
  }

  async executeOrCreate(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return toNotificationPreferenceClientDTO(preference.toServerDTO());
  }
}

/**
 * 便捷函数：获取通知偏好设置
 */
export const getNotificationPreference = (accountUuid: string): Promise<NotificationPreferenceClientDTO | null> =>
  GetNotificationPreference.getInstance().execute(accountUuid);

export const getOrCreateNotificationPreference = (accountUuid: string): Promise<NotificationPreferenceClientDTO> =>
  GetNotificationPreference.getInstance().executeOrCreate(accountUuid);
