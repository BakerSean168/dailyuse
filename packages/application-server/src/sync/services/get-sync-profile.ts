/**
 * Get Sync Profile Service
 *
 * 获取同步配置文件的应用服务
 */

import type { SyncProfileClientDTO } from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';

/**
 * Get Sync Profile Service
 */
export class GetSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncProfile {
    if (!GetSyncProfile.instance) {
      GetSyncProfile.instance = GetSyncProfile.createInstance();
    }
    return GetSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncProfile.instance = undefined as unknown as GetSyncProfile;
  }

  async execute(profileId: string): Promise<SyncProfileClientDTO | null> {
    const profile = await this.profileRepository.findByUuid(profileId);
    return profile ? profile.toClientDTO() : null;
  }
}

/**
 * 便捷函数：获取同步配置
 */
export const getSyncProfile = (profileId: string): Promise<SyncProfileClientDTO | null> =>
  GetSyncProfile.getInstance().execute(profileId);
