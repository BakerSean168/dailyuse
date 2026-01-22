/**
 * Update Sync Profile Service
 *
 * 更新同步配置文件的应用服务
 */

import type {
  UpdateSyncProfileRequest,
  SyncProfileClientDTO,
  SyncProfileConfigDTO,
  SyncProviderConfigDTO,
} from '@dailyuse/contracts/sync';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Update Sync Profile Service
 */
export class UpdateSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  async execute(
    accountUuid: string,
    request: UpdateSyncProfileRequest,
  ): Promise<SyncProfileClientDTO> {
    // 1. 查找配置
    const profile = await this.profileRepository.findByUuid(request.profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${request.profileId}`);
    }

    // 2. 检查名称唯一性
    if (request.name && request.name !== profile.name) {
      const nameExists = await this.profileRepository.existsByName(
        accountUuid,
        request.name,
        profile.uuid,
      );
      if (nameExists) {
        throw new Error(`同步配置名称 "${request.name}" 已存在`);
      }
      profile.updateName(request.name);
    }

    // 3. 更新其他字段
    if (request.syncConfig) {
      const mergedConfig = { ...profile.syncConfig, ...request.syncConfig };
      profile.updateSyncConfig(mergedConfig as SyncProfileConfigDTO);
    }

    if (request.providerConfig) {
      const mergedProviderConfig = { ...profile.providerConfig, ...request.providerConfig };
      profile.updateProviderConfig(mergedProviderConfig as SyncProviderConfigDTO);
    }

    // 4. 持久化
    await this.profileRepository.save(profile);

    // 5. 发布事件
    await eventBus.emit('sync.profile.updated', {
      profileId: profile.uuid,
      accountUuid,
    });

    return profile.toClientDTO();
  }
}
