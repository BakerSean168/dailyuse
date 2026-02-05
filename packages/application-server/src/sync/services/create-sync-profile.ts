/**
 * Create Sync Profile Service
 *
 * 创建同步配置文件的应用服务
 */

import { SyncProfile, type ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import type { CreateSyncProfileReq, SyncProfileClientDTO, SyncProviderType } from '@dailyuse/contracts/sync';

/**
 * Create Sync Profile Service
 */
export class CreateSyncProfile {
  constructor(private readonly profileRepository: ISyncProfileRepository) {}

  async execute(
    accountUuid: string,
    request: CreateSyncProfileReq,
  ): Promise<SyncProfileClientDTO> {
    // 1. 检查名称是否已存在
    const nameExists = await this.profileRepository.existsByName(accountUuid, request.name);
    if (nameExists) {
      throw new Error(`同步配置名称 "${request.name}" 已存在`);
    }

    // 2. 创建领域对象
    // Note: CreateSyncProfileReq has simplified fields (direction, strategy)
    // that don't directly map to the full SyncProfileConfigDTO
    // Using default config for now - can be extended later
    const profile = SyncProfile.create({
      name: request.name,
      description: request.description,
      providerType: request.providerType as SyncProviderType,
      providerConfig: (request.config ?? {}) as any,
      // syncConfig will use defaults from SyncProfileConfig.createDefault()
    });

    // 3. 持久化
    await this.profileRepository.save(profile);

    return profile.toClientDTO();
  }
}
