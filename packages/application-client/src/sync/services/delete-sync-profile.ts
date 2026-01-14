/**
 * Delete Sync Profile
 *
 * 删除同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Delete Sync Profile
 */
export class DeleteSyncProfile {
  private static instance: DeleteSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): DeleteSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteSyncProfile.instance = new DeleteSyncProfile(client);
    return DeleteSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteSyncProfile {
    if (!DeleteSyncProfile.instance) {
      DeleteSyncProfile.instance = DeleteSyncProfile.createInstance();
    }
    return DeleteSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteSyncProfile.instance = undefined as unknown as DeleteSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<void> {
    await this.apiClient.deleteProfile(profileId);
  }
}
