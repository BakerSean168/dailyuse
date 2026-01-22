/**
 * Create Sync Profile Service
 *
 * 创建同步配置文件的应用服务
 */

import { SyncProfile, type ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import type { CreateSyncProfileRequest, SyncProfileClientDTO } from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Create Sync Profile Service
 */
export class CreateSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  async execute(
    accountUuid: string,
    request: CreateSyncProfileRequest,
  ): Promise<SyncProfileClientDTO> {
    // 1. 检查名称是否已存在
    const nameExists = await this.profileRepository.existsByName(accountUuid, request.name);
    if (nameExists) {
      throw new Error(`同步配置名称 "${request.name}" 已存在`);
    }

    // 2. 创建领域对象
    const profile = SyncProfile.create({
      name: request.name,
      description: request.description,
      providerType: request.providerType,
      providerConfig: request.providerConfig,
      syncConfig: request.syncConfig,
    });

    // 3. 如果设置为默认，先取消其他默认配置
    if (request.setAsDefault) {
      await this.clearDefaultProfile(accountUuid);
      profile.setAsDefault();
    }

    // 4. 持久化
    await this.profileRepository.save(profile);

    // 5. 发布事件
    await eventBus.emit('sync.profile.created', {
      profileId: profile.uuid,
      accountUuid,
      providerType: request.providerType,
    });

    return profile.toClientDTO();
  }

  private async clearDefaultProfile(accountUuid: string): Promise<void> {
    const currentDefault = await this.profileRepository.findDefault(accountUuid);
    if (currentDefault) {
      currentDefault.unsetDefault();
      await this.profileRepository.save(currentDefault);
    }
  }
}
