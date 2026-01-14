/**
 * Sync Container
 *
 * Sync 模块的依赖容器，管理:
 * - API Clients (IPC)
 *
 * @example
 * ```ts
 * // 注册依赖
 * SyncContainer.getInstance()
 *   .registerApiClient(new SyncIpcAdapter(ipcClient));
 *
 * // 获取依赖
 * const api = SyncContainer.getInstance().getApiClient();
 * ```
 */

import { ModuleContainerBase } from '../shared/di';
import type { ISyncApiClient } from './ports/sync-api-client.port';

/**
 * Sync 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('SyncApiClient'),
} as const;

/**
 * Sync 模块依赖容器
 */
export class SyncContainer extends ModuleContainerBase {
  private static instance: SyncContainer;

  private constructor() {
    super();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): SyncContainer {
    if (!SyncContainer.instance) {
      SyncContainer.instance = new SyncContainer();
    }
    return SyncContainer.instance;
  }

  /**
   * 创建新的容器实例（用于测试）
   */
  static createInstance(): SyncContainer {
    return new SyncContainer();
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    SyncContainer.instance = undefined as unknown as SyncContainer;
  }

  // ============ API Client ============

  /**
   * 注册 Sync API Client
   */
  registerApiClient(client: ISyncApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Sync API Client
   */
  getApiClient(): ISyncApiClient {
    return this.container.resolve<ISyncApiClient>(KEYS.API_CLIENT);
  }

  /**
   * 检查是否已注册 API Client
   */
  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ 抽象方法实现 ============

  /**
   * 检查模块是否已完全配置
   */
  isConfigured(): boolean {
    return this.hasApiClient();
  }

  /**
   * 清空模块的所有依赖
   */
  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
  }
}

export { KEYS as SyncContainerKeys };
