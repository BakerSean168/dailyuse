/**
 * Set Default Sync Profile
 *
 * 设置默认同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Set Default Sync Profile
 */
export class SetDefaultSyncProfile {
  private static instance: SetDefaultSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): SetDefaultSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    SetDefaultSyncProfile.instance = new SetDefaultSyncProfile(client);
    return SetDefaultSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SetDefaultSyncProfile {
    if (!SetDefaultSyncProfile.instance) {
      SetDefaultSyncProfile.instance = SetDefaultSyncProfile.createInstance();
    }
    return SetDefaultSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SetDefaultSyncProfile.instance = undefined as unknown as SetDefaultSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<SyncProfile> {
    const data = await this.apiClient.setDefaultProfile(profileId);
    return SyncProfile.fromClientDTO(data);
  }
}
