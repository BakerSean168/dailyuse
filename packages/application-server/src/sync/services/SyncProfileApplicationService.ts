/**
 * SyncProfile Application Service
 *
 * 同步配置文件应用服务
 *
 * 职责：
 * - 创建/更新/删除同步配置
 * - 设置默认配置
 * - 激活/停用配置
 * - 管理提供者连接状态
 */

import {
  SyncProfile,
  type ISyncProfileRepository,
} from '@dailyuse/domain-server/sync';
import type {
  SyncProfileClientDTO,
  SyncProviderType,
  SyncProviderConfigDTO,
  SyncProfileConfigDTO,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  SyncProfileListResponse,
} from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * 发布配置文件相关事件
 */
async function publishProfileEvents(eventType: string, data: unknown): Promise<void> {
  await eventBus.emit(eventType, data);
}

/**
 * SyncProfile Application Service
 */
export class SyncProfileApplicationService {
  constructor(
    private readonly profileRepository: ISyncProfileRepository,
    private readonly accountUuid: string,
  ) {}

  /**
   * 创建同步配置文件
   */
  async createProfile(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    // 1. 检查名称是否已存在
    const nameExists = await this.profileRepository.existsByName(request.name);
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
      await this.clearDefaultProfile();
      profile.setAsDefault();
    }

    // 4. 持久化
    await this.profileRepository.save(profile);

    // 5. 发布事件
    await publishProfileEvents('sync.profile.created', {
      profileId: profile.uuid,
      accountUuid: this.accountUuid,
      providerType: request.providerType,
    });

    return profile.toClientDTO();
  }

  /**
   * 更新同步配置文件
   */
  async updateProfile(request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    // 1. 查找配置
    const profile = await this.profileRepository.findByUuid(request.profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${request.profileId}`);
    }

    // 2. 检查名称唯一性
    if (request.name && request.name !== profile.name) {
      const nameExists = await this.profileRepository.existsByName(request.name, profile.uuid);
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
    await publishProfileEvents('sync.profile.updated', {
      profileId: profile.uuid,
      accountUuid: this.accountUuid,
    });

    return profile.toClientDTO();
  }

  /**
   * 删除同步配置文件
   */
  async deleteProfile(profileId: string): Promise<void> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    // 不允许删除默认配置
    if (profile.isDefault) {
      throw new Error('不能删除默认配置，请先设置其他配置为默认');
    }

    await this.profileRepository.delete(profileId);

    await publishProfileEvents('sync.profile.deleted', {
      profileId,
      accountUuid: this.accountUuid,
    });
  }

  /**
   * 获取单个配置文件
   */
  async getProfile(profileId: string): Promise<SyncProfileClientDTO | null> {
    const profile = await this.profileRepository.findByUuid(profileId);
    return profile ? profile.toClientDTO() : null;
  }

  /**
   * 获取所有配置文件列表
   */
  async listProfiles(): Promise<SyncProfileListResponse> {
    const profiles = await this.profileRepository.findAll();
    const defaultProfile = profiles.find((p: SyncProfile) => p.isDefault);
    const activeProfile = profiles.find((p: SyncProfile) => p.isActive);

    return {
      profiles: profiles.map((p: SyncProfile) => p.toClientDTO()),
      activeProfileId: activeProfile?.uuid,
      defaultProfileId: defaultProfile?.uuid,
      total: profiles.length,
    };
  }

  /**
   * 获取活跃的配置文件
   */
  async getActiveProfiles(): Promise<SyncProfileClientDTO[]> {
    const profiles = await this.profileRepository.findActive();
    return profiles.map((p: SyncProfile) => p.toClientDTO());
  }

  /**
   * 获取默认配置文件
   */
  async getDefaultProfile(): Promise<SyncProfileClientDTO | null> {
    const profile = await this.profileRepository.findDefault();
    return profile ? profile.toClientDTO() : null;
  }

  /**
   * 设置默认配置文件
   */
  async setDefaultProfile(profileId: string): Promise<SyncProfileClientDTO> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    // 1. 取消其他默认配置
    await this.clearDefaultProfile();

    // 2. 设置新的默认
    profile.setAsDefault();
    await this.profileRepository.save(profile);

    await publishProfileEvents('sync.profile.default-changed', {
      profileId,
      accountUuid: this.accountUuid,
    });

    return profile.toClientDTO();
  }

  /**
   * 激活配置文件
   */
  async activateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    profile.activate();
    await this.profileRepository.save(profile);

    return profile.toClientDTO();
  }

  /**
   * 停用配置文件
   */
  async deactivateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    profile.deactivate();
    await this.profileRepository.save(profile);

    return profile.toClientDTO();
  }

  /**
   * 更新提供者连接状态
   */
  async updateConnectionStatus(profileId: string, isConnected: boolean): Promise<void> {
    const profile = await this.profileRepository.findByUuid(profileId);
    if (!profile) {
      throw new Error(`同步配置不存在: ${profileId}`);
    }

    profile.setConnected(isConnected);
    await this.profileRepository.save(profile);
  }

  /**
   * 清除所有配置的默认状态
   */
  private async clearDefaultProfile(): Promise<void> {
    const currentDefault = await this.profileRepository.findDefault();
    if (currentDefault) {
      currentDefault.unsetDefault();
      await this.profileRepository.save(currentDefault);
    }
  }
}
