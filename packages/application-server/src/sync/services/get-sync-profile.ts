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

  async execute(profileId: string): Promise<SyncProfileClientDTO | null> {
    const profile = await this.profileRepository.findByUuid(profileId);
    return profile ? profile.toClientDTO() : null;
  }
}
