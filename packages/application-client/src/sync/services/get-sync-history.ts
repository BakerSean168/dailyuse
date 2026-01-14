/**
 * Get Sync History
 *
 * 获取同步历史用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { SyncHistoryRequest } from '@dailyuse/contracts/sync';
import { SyncSession } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Sync History Result
 */
export interface GetSyncHistoryResult {
  sessions: SyncSession[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Get Sync History
 */
export class GetSyncHistory {
  private static instance: GetSyncHistory;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncHistory {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncHistory.instance = new GetSyncHistory(client);
    return GetSyncHistory.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncHistory {
    if (!GetSyncHistory.instance) {
      GetSyncHistory.instance = GetSyncHistory.createInstance();
    }
    return GetSyncHistory.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncHistory.instance = undefined as unknown as GetSyncHistory;
  }

  /**
   * 执行用例
   */
  async execute(request?: SyncHistoryRequest): Promise<GetSyncHistoryResult> {
    const response = await this.apiClient.getSyncHistory(request);
    return {
      sessions: response.sessions.map((s) => SyncSession.fromClientDTO(s)),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
    };
  }
}

/**
 * Get Sync Session
 */
export class GetSyncSession {
  private static instance: GetSyncSession;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): GetSyncSession {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSyncSession.instance = new GetSyncSession(client);
    return GetSyncSession.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSyncSession {
    if (!GetSyncSession.instance) {
      GetSyncSession.instance = GetSyncSession.createInstance();
    }
    return GetSyncSession.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSyncSession.instance = undefined as unknown as GetSyncSession;
  }

  /**
   * 执行用例
   */
  async execute(sessionId: string): Promise<SyncSession | null> {
    const data = await this.apiClient.getSession(sessionId);
    return data ? SyncSession.fromClientDTO(data) : null;
  }
}
