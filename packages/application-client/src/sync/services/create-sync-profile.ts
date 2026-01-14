/**
 * Create Sync Profile
 *
 * 创建同步配置用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { CreateSyncProfileRequest } from '@dailyuse/contracts/sync';
import { SyncProfile } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Create Sync Profile
 */
export class CreateSyncProfile {
  private static instance: CreateSyncProfile;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): CreateSyncProfile {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateSyncProfile.instance = new CreateSyncProfile(client);
    return CreateSyncProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateSyncProfile {
    if (!CreateSyncProfile.instance) {
      CreateSyncProfile.instance = CreateSyncProfile.createInstance();
    }
    return CreateSyncProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateSyncProfile.instance = undefined as unknown as CreateSyncProfile;
  }

  /**
   * 执行用例
   */
  async execute(request: CreateSyncProfileRequest): Promise<SyncProfile> {
    const data = await this.apiClient.createProfile(request);
    return SyncProfile.fromClientDTO(data);
  }
}
