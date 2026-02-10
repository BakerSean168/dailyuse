/**
 * Repository Container
 *
 * Repository 模块的依赖容器
 *
 * @example
 * ```ts
 * // 注册依赖
 * RepositoryContainer.getInstance()
 *   .registerApiClient(new RepositoryHttpAdapter(httpClient));
 *
 * // 获取依赖
 * const api = RepositoryContainer.getInstance().getApiClient();
 * ```
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IRepositoryApiClient } from './ports/repository-api-client.port';

/**
 * Repository 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('RepositoryApiClient'),
} as const;

/**
 * Repository 模块依赖容器
 */
export class RepositoryContainer extends ModuleContainerBase {
  private static instance: RepositoryContainer;

  private constructor() {
    super();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    RepositoryContainer.instance = undefined as unknown as RepositoryContainer;
  }

  // ============ API Client ============

  /**
   * 注册 Repository API Client
   */
  registerApiClient(client: IRepositoryApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Repository API Client
   */
  getApiClient(): IRepositoryApiClient {
    return this.container.resolve<IRepositoryApiClient>(KEYS.API_CLIENT);
  }

  /**
   * 检查 API Client 是否已注册
   */
  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ 通用方法 ============

  /**
   * 检查容器是否已配置
   */
  isConfigured(): boolean {
    return this.hasApiClient();
  }

  /**
   * 清空所有已注册的依赖
   */
  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
  }
}

export { KEYS as RepositoryDependencyKeys };
