/**
 * Update Sync Profile Service
 *
 * 更新同步配置文件的应用服务
 */

import type {
  UpdateSyncProfileReq,
  SyncProfileClientDTO,
} from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';

/**
 * Update Sync Profile Service
 */
export class UpdateSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  async execute(
    accountUuid: string,
    profileId: string,
    request: UpdateSyncProfileReq,
  ): Promise<SyncProfileClientDTO> {
    // 1. 查找配置
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    // 2. 检查名称唯一性
    if (request.name && request.name !== profile.name) {
      const nameExists = await this.profileRepository.existsByName(
        accountUuid,
        request.name,
        profile.id,
      );
      if (nameExists) {
        throw new Error(`同步配置名称 "${request.name}" 已存在`);
      }
      profile.updateName(request.name);
    }

    // 3. 更新同步配置
    // Note: UpdateSyncProfileReq has direction/strategy fields but they use
    // different enum values than the domain types. Skipping these for now.
    // TODO: Add proper mapping between API and domain types

    if (request.config) {
      // config 是通用配置，合并到 providerConfig
      const currentProviderConfig = profile.providerConfig;
      profile.updateProviderConfig({
        ...currentProviderConfig,
        ...request.config,
      });
    }

    // 4. 持久化
    await this.profileRepository.save(profile);

    return profile.toClientDTO();
  }
}
