/**
 * Retry Sync
 *
 * 重试同步用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { StartSyncResponse } from '@dailyuse/contracts/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Retry Sync
 */
export class RetrySync {
  private static instance: RetrySync;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): RetrySync {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RetrySync.instance = new RetrySync(client);
    return RetrySync.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RetrySync {
    if (!RetrySync.instance) {
      RetrySync.instance = RetrySync.createInstance();
    }
    return RetrySync.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RetrySync.instance = undefined as unknown as RetrySync;
  }

  /**
   * 执行用例
   */
  async execute(sessionId: string): Promise<StartSyncResponse> {
    return this.apiClient.retrySync(sessionId);
  }
}
