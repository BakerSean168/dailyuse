/**
 * Get Sync Profiles
 *
 * 获取同步配置列表用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Sync Profiles Result
 */
export interface GetSyncProfilesResult {
  profiles: SyncProfile[];
  defaultProfileId?: string;
  total: number;
}

/**
 * Get Sync Profiles
 */
export class GetSyncProfiles {
  private static instance: GetSyncProfiles;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncProfiles {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncProfiles.instance = new GetSyncProfiles(client);
    return GetSyncProfiles.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncProfiles {
    if (!GetSyncProfiles.instance) {
      GetSyncProfiles.instance = GetSyncProfiles.createInstance();
    }
    return GetSyncProfiles.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncProfiles.instance = undefined as unknown as GetSyncProfiles;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<GetSyncProfilesResult> {
    const response = await this.apiClient.getProfiles();
    return {
      profiles: response.profiles.map((p) => SyncProfile.fromClientDTO(p)),
      defaultProfileId: response.defaultProfileId,
      total: response.total,
    };
  }
}
