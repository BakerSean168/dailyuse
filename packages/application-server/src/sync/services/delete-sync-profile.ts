/**
 * Delete Sync Profile Service
 *
 * 删除同步配置文件的应用服务
 */

import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Delete Sync Profile Service
 */
export class DeleteSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteSyncProfile {
    if (!DeleteSyncProfile.instance) {
      DeleteSyncProfile.instance = DeleteSyncProfile.createInstance();
    }
    return DeleteSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteSyncProfile.instance = undefined as unknown as DeleteSyncProfile;
  }

  async execute(accountUuid: string, profileId: string): Promise<void> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    // 不允许删除默认配置
    if (profile.isDefault) {
      throw new Error('不能删除默认配置，请先设置其他配置为默认');
    }

    await this.profileRepository.delete(profileId);

    await eventBus.emit('sync.profile.deleted', {
      profileId,
      accountUuid,
    });
  }
}

/**
 * 便捷函数：删除同步配置
 */
export const deleteSyncProfile = (accountUuid: string, profileId: string): Promise<void> =>
  DeleteSyncProfile.getInstance().execute(accountUuid, profileId);
