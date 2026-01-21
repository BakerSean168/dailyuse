/**
 * Set Default Sync Profile Service
 *
 * 设置默认同步配置文件的应用服务
 */

import type { SyncProfileClientDTO } from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Set Default Sync Profile Service
 */
export class SetDefaultSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): SetDefaultSyncProfile {
    if (!SetDefaultSyncProfile.instance) {
      SetDefaultSyncProfile.instance = SetDefaultSyncProfile.createInstance();
    }
    return SetDefaultSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SetDefaultSyncProfile.instance = undefined as unknown as SetDefaultSyncProfile;
  }

  async execute(accountUuid: string, profileId: string): Promise<SyncProfileClientDTO> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    // 取消其他默认配置
    const currentDefault = await this.profileRepository.findDefault(accountUuid);
    if (currentDefault) {
      currentDefault.unsetDefault();
      await this.profileRepository.save(currentDefault);
    }

    // 设置新的默认
    profile.setAsDefault();
    await this.profileRepository.save(profile);

    await eventBus.emit('sync.profile.default-changed', {
      profileId,
      accountUuid,
    });

    return profile.toClientDTO();
  }
}

/**
 * 便捷函数：设置默认同步配置
 */
export const setDefaultSyncProfile = (accountUuid: string, profileId: string): Promise<SyncProfileClientDTO> =>
  SetDefaultSyncProfile.getInstance().execute(accountUuid, profileId);
