/**
 * Get Sync Profile
 *
 * 获取单个同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Sync Profile
 */
export class GetSyncProfile {
  private static instance: GetSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncProfile.instance = new GetSyncProfile(client);
    return GetSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncProfile {
    if (!GetSyncProfile.instance) {
      GetSyncProfile.instance = GetSyncProfile.createInstance();
    }
    return GetSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncProfile.instance = undefined as unknown as GetSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(profileId: string): Promise<SyncProfile | null> {
    const data = await this.apiClient.getProfile(profileId);
    return data ? SyncProfile.fromClientDTO(data) : null;
  }
}
