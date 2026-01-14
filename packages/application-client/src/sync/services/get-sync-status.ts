/**
 * Get Sync Status
 *
 * 获取同步状态用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { SyncStatusResponse } from '@dailyuse/contracts/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Sync Status
 */
export class GetSyncStatus {
  private static instance: GetSyncStatus;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncStatus {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncStatus.instance = new GetSyncStatus(client);
    return GetSyncStatus.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncStatus {
    if (!GetSyncStatus.instance) {
      GetSyncStatus.instance = GetSyncStatus.createInstance();
    }
    return GetSyncStatus.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncStatus.instance = undefined as unknown as GetSyncStatus;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<SyncStatusResponse> {
    return this.apiClient.getSyncStatus();
  }
}
