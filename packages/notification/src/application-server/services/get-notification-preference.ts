/**
 * Get Notification Preference Service
 *
 * 获取通知偏好设置的应用服务
 */

import { NotificationPreferenceDomainService } from '../../domain-server/services/NotificationPreferenceDomainService';
import type { NotificationPreferenceClientDTO } from '@dailyuse/contracts/notification';
import type { INotificationPreferenceRepository } from '../../domain-server/repositories/INotificationPreferenceRepository';
import { toNotificationPreferenceClientDTO } from './notification-dto-converters';

/**
 * Get Notification Preference Service
 */
export class GetNotificationPreference {
  private preferenceService: NotificationPreferenceDomainService;

  constructor(private readonly preferenceRepository: INotificationPreferenceRepository) {
    this.preferenceService = new NotificationPreferenceDomainService(preferenceRepository);
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
