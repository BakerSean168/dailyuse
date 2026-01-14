/**
 * Activate/Deactivate Sync Profile
 *
 * 激活/停用同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Activate Sync Profile
 */
export class ActivateSyncProfile {
  private static instance: ActivateSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): ActivateSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ActivateSyncProfile.instance = new ActivateSyncProfile(client);
    return ActivateSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateSyncProfile {
    if (!ActivateSyncProfile.instance) {
      ActivateSyncProfile.instance = ActivateSyncProfile.createInstance();
    }
    return ActivateSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateSyncProfile.instance = undefined as unknown as ActivateSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<SyncProfile> {
    const data = await this.apiClient.activateProfile(profileId);
    return SyncProfile.fromClientDTO(data);
  }
}

/**
 * Deactivate Sync Profile
 */
export class DeactivateSyncProfile {
  private static instance: DeactivateSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): DeactivateSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeactivateSyncProfile.instance = new DeactivateSyncProfile(client);
    return DeactivateSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeactivateSyncProfile {
    if (!DeactivateSyncProfile.instance) {
      DeactivateSyncProfile.instance = DeactivateSyncProfile.createInstance();
    }
    return DeactivateSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeactivateSyncProfile.instance = undefined as unknown as DeactivateSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<SyncProfile> {
    const data = await this.apiClient.deactivateProfile(profileId);
    return SyncProfile.fromClientDTO(data);
  }
}
