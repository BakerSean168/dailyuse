/**
 * Cancel Sync
 *
 * 取消同步用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { CancelSyncRequest } from '@dailyuse/contracts/sync';
import { SyncSession } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Cancel Sync
 */
export class CancelSync {
  private static instance: CancelSync;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): CancelSync {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CancelSync.instance = new CancelSync(client);
    return CancelSync.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CancelSync {
    if (!CancelSync.instance) {
      CancelSync.instance = CancelSync.createInstance();
    }
    return CancelSync.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CancelSync.instance = undefined as unknown as CancelSync;
  }

  /**
   * 执行用例
   */
  async execute(request: CancelSyncRequest): Promise<SyncSession> {
    const sessionData = await this.apiClient.cancelSync(request);
    return SyncSession.fromClientDTO(sessionData);
  }
}
