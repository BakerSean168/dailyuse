/**
 * Get Sync Conflicts
 *
 * 获取同步冲突用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import { SyncConflict } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Conflicts Result
 */
export interface GetSyncConflictsResult {
  conflicts: SyncConflict[];
  total: number;
}

/**
 * Get Sync Conflicts
 */
export class GetSyncConflicts {
  private static instance: GetSyncConflicts;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncConflicts {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncConflicts.instance = new GetSyncConflicts(client);
    return GetSyncConflicts.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncConflicts {
    if (!GetSyncConflicts.instance) {
      GetSyncConflicts.instance = GetSyncConflicts.createInstance();
    }
    return GetSyncConflicts.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncConflicts.instance = undefined as unknown as GetSyncConflicts;
  }

  /**
   * 执行用例
   */
  async execute(sessionId?: string): Promise<GetSyncConflictsResult> {
    const response = await this.apiClient.getConflicts(sessionId);
    return {
      conflicts: response.conflicts.map((c) => SyncConflict.fromClientDTO(c)),
      total: response.total,
    };
  }
}
