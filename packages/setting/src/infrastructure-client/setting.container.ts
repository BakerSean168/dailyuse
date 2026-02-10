/**
 * Setting Container
 *
 * Setting 模块的依赖容器
 *
 * @example
 * ```ts
 * // 注册依赖
 * SettingContainer.getInstance()
 *   .registerApiClient(new SettingHttpAdapter(httpClient));
 *
 * // 获取依赖
 * const api = SettingContainer.getInstance().getApiClient();
 * ```
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { ISettingApiClient } from './ports/setting-api-client.port';

/**
 * Setting 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('SettingApiClient'),
} as const;

/**
 * Setting 模块依赖容器
 */
export class SettingContainer extends ModuleContainerBase {
  private static instance: SettingContainer;

  private constructor() {
    super();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): SettingContainer {
    if (!SettingContainer.instance) {
      SettingContainer.instance = new SettingContainer();
    }
    return SettingContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    SettingContainer.instance = undefined as unknown as SettingContainer;
  }

  // ============ API Client ============

  /**
   * 注册 Setting API Client
   */
  registerApiClient(client: ISettingApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Setting API Client
   */
  getApiClient(): ISettingApiClient {
    return this.container.resolve<ISettingApiClient>(KEYS.API_CLIENT);
  }

  /**
   * 检查 API Client 是否已注册
   */
  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ 便利属性（向后兼容） ============

  /**
   * 获取 Setting API Client（便利属性）
   * @deprecated 请使用 getApiClient() 方法
   */
  get settingClient(): ISettingApiClient {
    return this.getApiClient();
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

export { KEYS as SettingDependencyKeys };
