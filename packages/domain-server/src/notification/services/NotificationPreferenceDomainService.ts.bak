/**
 * NotificationPreference 领域服务
 *
 * 管理用户通知偏好的业务逻辑
 */

import type { INotificationPreferenceRepository } from '../repositories/INotificationPreferenceRepository';
import { NotificationPreference } from '../aggregates/NotificationPreference';
import type { CategoryPreferenceServerDTO, ChannelPreferences } from '@dailyuse/contracts/notification';
import { NotificationCategory } from '@dailyuse/contracts/notification';

/**
 * NotificationPreferenceDomainService
 */
export class NotificationPreferenceDomainService {
  constructor(
    private readonly preferenceRepo: INotificationPreferenceRepository,
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 获取或创建用户偏好设置
   */
  public async getOrCreatePreference(accountUuid: string): Promise<NotificationPreference> {
    return await this.preferenceRepo.getOrCreate(accountUuid);
  }

  /**
   * 获取用户偏好设置
   */
  public async getPreference(accountUuid: string): Promise<NotificationPreference | null> {
    return await this.preferenceRepo.findByAccountUuid(accountUuid);
  }

  /**
   * 启用所有通知
   */
  public async enableAllNotifications(accountUuid: string): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.enableAll();
    await this.preferenceRepo.save(preference);

    // await this.eventBus.publish({
    //   type: 'notification.preference.updated',
    //   aggregateId: preference.uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     preference: preference.toServerDTO(),
    //     changes: ['enabled'],
    //   },
    // });
  }

  /**
   * 禁用所有通知
   */
  public async disableAllNotifications(accountUuid: string): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.disableAll();
    await this.preferenceRepo.save(preference);
  }

  /**
   * 启用指定渠道
   */
  public async enableChannel(
    accountUuid: string,
    channel: 'inApp' | 'email' | 'push' | 'sms',
  ): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.enableChannel(channel);
    await this.preferenceRepo.save(preference);
  }

  /**
   * 禁用指定渠道
   */
  public async disableChannel(
    accountUuid: string,
    channel: 'inApp' | 'email' | 'push' | 'sms',
  ): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.disableChannel(channel);
    await this.preferenceRepo.save(preference);
  }

  /**
   * 批量更新渠道设置
   */
  public async updateChannels(
    accountUuid: string,
    channels: Partial<ChannelPreferences>,
  ): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);

    for (const [channel, enabled] of Object.entries(channels)) {
      const channelKey = channel as 'inApp' | 'email' | 'push' | 'sms';
      if (enabled) {
        preference.enableChannel(channelKey);
      } else {
        preference.disableChannel(channelKey);
      }
    }

    await this.preferenceRepo.save(preference);
  }

  /**
   * 更新分类偏好
   */
  public async updateCategoryPreference(
    accountUuid: string,
    category: NotificationCategory,
    preference: Partial<CategoryPreferenceServerDTO>,
  ): Promise<void> {
    const userPreference = await this.getOrCreatePreference(accountUuid);
    userPreference.updateCategoryPreference(category, preference);
    await this.preferenceRepo.save(userPreference);
  }

  /**
   * 启用免打扰
   */
  public async enableDoNotDisturb(
    accountUuid: string,
    startTime: string,
    endTime: string,
    daysOfWeek: number[],
  ): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.enableDoNotDisturb(startTime, endTime, daysOfWeek);
    await this.preferenceRepo.save(preference);

    // await this.eventBus.publish({
    //   type: 'notification.preference.updated',
    //   aggregateId: preference.uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     preference: preference.toServerDTO(),
    //     changes: ['doNotDisturb'],
    //   },
    // });
  }

  /**
   * 禁用免打扰
   */
  public async disableDoNotDisturb(accountUuid: string): Promise<void> {
    const preference = await this.getOrCreatePreference(accountUuid);
    preference.disableDoNotDisturb();
    await this.preferenceRepo.save(preference);
  }

  /**
   * 检查是否在免打扰时段
   */
  public async isInDoNotDisturbPeriod(accountUuid: string): Promise<boolean> {
    const preference = await this.preferenceRepo.findByAccountUuid(accountUuid);
    if (!preference) {
      return false; // 没有设置偏好，不在免打扰时段
    }

    return preference.isInDoNotDisturbPeriod();
  }

  /**
   * 检查是否应该发送通知
   */
  public async shouldSendNotification(
    accountUuid: string,
    category: string,
    type: string,
    channel: string,
  ): Promise<boolean> {
    const preference = await this.preferenceRepo.findByAccountUuid(accountUuid);
    if (!preference) {
      return true; // 没有设置偏好，允许发送
    }

    return preference.shouldSendNotification(category, type, channel);
  }

  /**
   * 重置为默认设置
   */
  public async resetToDefault(accountUuid: string): Promise<void> {
    // 删除现有设置
    const existing = await this.preferenceRepo.findByAccountUuid(accountUuid);
    if (existing) {
      await this.preferenceRepo.delete(existing.uuid);
    }

    // 创建新的默认设置
    await this.getOrCreatePreference(accountUuid);
  }

  /**
   * 删除用户偏好设置
   */
  public async deletePreference(accountUuid: string): Promise<void> {
    const preference = await this.preferenceRepo.findByAccountUuid(accountUuid);
    if (preference) {
      await this.preferenceRepo.delete(preference.uuid);
    }
  }
}
