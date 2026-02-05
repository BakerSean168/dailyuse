/**
 * List Sync Profiles Service
 *
 * 列出同步配置文件的应用服务
 */

import type { GetSyncProfilesRes } from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import { SyncProfile } from '@dailyuse/domain-server/sync';

/**
 * List Sync Profiles Service
 */
export class ListSyncProfiles {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  async execute(accountUuid: string): Promise<GetSyncProfilesRes> {
    const profiles = await this.profileRepository.findAll(accountUuid);

    return {
      data: profiles.map((p: SyncProfile) => p.toClientDTO()),
      total: profiles.length,
    };
  }
}
