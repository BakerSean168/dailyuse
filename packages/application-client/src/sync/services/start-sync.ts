/**
 * Start Sync
 *
 * 启动同步用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { StartSyncRequest, StartSyncResponse } from '@dailyuse/contracts/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Start Sync
 */
export class StartSync {
  private static instance: StartSync;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): StartSync {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    StartSync.instance = new StartSync(client);
    return StartSync.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): StartSync {
    if (!StartSync.instance) {
      StartSync.instance = StartSync.createInstance();
    }
    return StartSync.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StartSync.instance = undefined as unknown as StartSync;
  }

  /**
   * 执行用例
   */
  async execute(request: StartSyncRequest): Promise<StartSyncResponse> {
    return this.apiClient.startSync(request);
  }
}
