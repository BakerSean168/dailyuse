/**
 * Update Sync Profile
 *
 * 更新同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateSyncProfileRequest } from '@dailyuse/contracts/sync';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Sync Profile
 */
export class UpdateSyncProfile {
  private static instance: UpdateSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): UpdateSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateSyncProfile.instance = new UpdateSyncProfile(client);
    return UpdateSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateSyncProfile {
    if (!UpdateSyncProfile.instance) {
      UpdateSyncProfile.instance = UpdateSyncProfile.createInstance();
    }
    return UpdateSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateSyncProfile.instance = undefined as unknown as UpdateSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(request: UpdateSyncProfileRequest): Promise<SyncProfile> {
    const data = await this.apiClient.updateProfile(request);
    return SyncProfile.fromClientDTO(data);
  }
}
