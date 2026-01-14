/**
 * Get Pending Changes
 *
 * 获取待同步变更用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { PendingChangesRequest, PendingChangesResponse } from '@dailyuse/contracts/sync';
import { PendingChange } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Pending Changes Result
 */
export interface GetPendingChangesResult {
  changes: PendingChange[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Get Pending Changes
 */
export class GetPendingChanges {
  private static instance: GetPendingChanges;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetPendingChanges {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetPendingChanges.instance = new GetPendingChanges(client);
    return GetPendingChanges.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetPendingChanges {
    if (!GetPendingChanges.instance) {
      GetPendingChanges.instance = GetPendingChanges.createInstance();
    }
    return GetPendingChanges.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetPendingChanges.instance = undefined as unknown as GetPendingChanges;
  }

  /**
   * 执行用例
   */
  async execute(request?: PendingChangesRequest): Promise<GetPendingChangesResult> {
    const response = await this.apiClient.getPendingChanges(request);
    return {
      changes: response.changes.map((c) => PendingChange.fromClientDTO(c)),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
    };
  }
}

/**
 * Get Pending Count
 */
export class GetPendingCount {
  private static instance: GetPendingCount;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetPendingCount {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetPendingCount.instance = new GetPendingCount(client);
    return GetPendingCount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetPendingCount {
    if (!GetPendingCount.instance) {
      GetPendingCount.instance = GetPendingCount.createInstance();
    }
    return GetPendingCount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetPendingCount.instance = undefined as unknown as GetPendingCount;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<number> {
    return this.apiClient.getPendingCount();
  }
}
