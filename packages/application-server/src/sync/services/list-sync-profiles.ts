/**
 * List Sync Profiles Service
 *
 * 列出同步配置文件的应用服务
 */

import type { SyncProfileListResponse } from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import { SyncProfile } from '@dailyuse/domain-server/sync';

/**
 * List Sync Profiles Service
 */
export class ListSyncProfiles {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  /**
   * 获取服务单例
   */
  static getInstance(): ListSyncProfiles {
    if (!ListSyncProfiles.instance) {
      ListSyncProfiles.instance = ListSyncProfiles.createInstance();
    }
    return ListSyncProfiles.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListSyncProfiles.instance = undefined as unknown as ListSyncProfiles;
  }

  async execute(accountUuid: string): Promise<SyncProfileListResponse> {
    const profiles = await this.profileRepository.findAll(accountUuid);
    const defaultProfile = profiles.find((p: SyncProfile) => p.isDefault);
    const activeProfile = profiles.find((p: SyncProfile) => p.isActive);

    return {
      profiles: profiles.map((p: SyncProfile) => p.toClientDTO()),
      activeProfileId: activeProfile?.uuid,
      defaultProfileId: defaultProfile?.uuid,
      total: profiles.length,
    };
  }
}

/**
 * 便捷函数：列出同步配置
 */
export const listSyncProfiles = (accountUuid: string): Promise<SyncProfileListResponse> =>
  ListSyncProfiles.getInstance().execute(accountUuid);
