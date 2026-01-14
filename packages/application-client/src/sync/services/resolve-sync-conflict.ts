/**
 * Resolve Sync Conflict
 *
 * 解决同步冲突用例
 */

import type { ISyncApiClient } from '@dailyuse/infrastructure-client';
import type { ResolveConflictRequest } from '@dailyuse/contracts/sync';
import { SyncConflict } from '@dailyuse/domain-client/sync';
import { SyncContainer } from '@dailyuse/infrastructure-client';

/**
 * Resolve Sync Conflict
 */
export class ResolveSyncConflict {
  private static instance: ResolveSyncConflict;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): ResolveSyncConflict {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ResolveSyncConflict.instance = new ResolveSyncConflict(client);
    return ResolveSyncConflict.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ResolveSyncConflict {
    if (!ResolveSyncConflict.instance) {
      ResolveSyncConflict.instance = ResolveSyncConflict.createInstance();
    }
    return ResolveSyncConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ResolveSyncConflict.instance = undefined as unknown as ResolveSyncConflict;
  }

  /**
   * 执行用例
   */
  async execute(request: ResolveConflictRequest): Promise<SyncConflict> {
    const data = await this.apiClient.resolveConflict(request);
    return SyncConflict.fromClientDTO(data);
  }
}

/**
 * Ignore Sync Conflict
 */
export class IgnoreSyncConflict {
  private static instance: IgnoreSyncConflict;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): IgnoreSyncConflict {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    IgnoreSyncConflict.instance = new IgnoreSyncConflict(client);
    return IgnoreSyncConflict.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): IgnoreSyncConflict {
    if (!IgnoreSyncConflict.instance) {
      IgnoreSyncConflict.instance = IgnoreSyncConflict.createInstance();
    }
    return IgnoreSyncConflict.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    IgnoreSyncConflict.instance = undefined as unknown as IgnoreSyncConflict;
  }

  /**
   * 执行用例
   */
  async execute(conflictId: string): Promise<SyncConflict> {
    const data = await this.apiClient.ignoreConflict(conflictId);
    return SyncConflict.fromClientDTO(data);
  }
}

/**
 * Auto Resolve Conflicts
 */
export class AutoResolveConflicts {
  private static instance: AutoResolveConflicts;

  private constructor(private readonly apiClient: ISyncApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ISyncApiClient): AutoResolveConflicts {
    const container = SyncContainer.getInstance();
    const client = apiClient || container.getApiClient();
    AutoResolveConflicts.instance = new AutoResolveConflicts(client);
    return AutoResolveConflicts.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): AutoResolveConflicts {
    if (!AutoResolveConflicts.instance) {
      AutoResolveConflicts.instance = AutoResolveConflicts.createInstance();
    }
    return AutoResolveConflicts.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    AutoResolveConflicts.instance = undefined as unknown as AutoResolveConflicts;
  }

  /**
   * 执行用例
   * @returns 自动解决的冲突数量
   */
  async execute(sessionId: string): Promise<number> {
    return this.apiClient.autoResolveConflicts(sessionId);
  }
}
