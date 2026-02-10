/**
 * Goal Container
 *
 * Goal 模块的依赖容器，管理:
 * - API Clients (HTTP/IPC)
 * - Repositories (本地存储，可选)
 *
 * @example
 * ```ts
 * // 注册依赖
 * GoalContainer.getInstance()
 *   .registerApiClient(new GoalHttpAdapter(httpClient))
 *   .registerRepository(new GoalIndexedDBRepository());
 *
 * // 获取依赖
 * const api = GoalContainer.getInstance().getApiClient();
 * ```
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IGoalApiClient } from './ports/goal-api-client.port';
import type { IGoalFolderApiClient } from './ports/goal-folder-api-client.port';
import type { IGoalFocusApiClient } from './ports/goal-focus-api-client.port';

/**
 * Goal 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('GoalApiClient'),
  FOLDER_API_CLIENT: Symbol('GoalFolderApiClient'),
  FOCUS_API_CLIENT: Symbol('GoalFocusApiClient'),
  REPOSITORY: Symbol('GoalRepository'),
} as const;

/**
 * Goal 仓储接口（本地存储）
 *
 * 用于离线缓存、乐观更新等场景
 */
export interface IGoalRepository {
  // 后续根据需要扩展
  // findById(uuid: string): Promise<Goal | null>;
  // save(goal: Goal): Promise<void>;
  // findAll(): Promise<Goal[]>;
}

/**
 * Goal 模块依赖容器
 */
export class GoalContainer extends ModuleContainerBase {
  private static instance: GoalContainer;

  private constructor() {
    super();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    GoalContainer.instance = undefined as unknown as GoalContainer;
  }

  // ============ API Client ============

  /**
   * 注册 Goal API Client
   */
  registerApiClient(client: IGoalApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Goal API Client
   */
  getApiClient(): IGoalApiClient {
    return this.container.resolve<IGoalApiClient>(KEYS.API_CLIENT);
  }

  /**
   * 检查 API Client 是否已注册
   */
  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ Folder API Client ============

  /**
   * 注册 Goal Folder API Client
   */
  registerFolderApiClient(client: IGoalFolderApiClient): this {
    this.container.register(KEYS.FOLDER_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Goal Folder API Client
   */
  getFolderApiClient(): IGoalFolderApiClient {
    return this.container.resolve<IGoalFolderApiClient>(KEYS.FOLDER_API_CLIENT);
  }

  /**
   * 检查 Folder API Client 是否已注册
   */
  hasFolderApiClient(): boolean {
    return this.container.has(KEYS.FOLDER_API_CLIENT);
  }

  // ============ Focus API Client ============

  /**
   * 注册 Goal Focus API Client
   */
  registerFocusApiClient(client: IGoalFocusApiClient): this {
    this.container.register(KEYS.FOCUS_API_CLIENT, client);
    return this;
  }

  /**
   * 获取 Goal Focus API Client
   */
  getFocusApiClient(): IGoalFocusApiClient {
    return this.container.resolve<IGoalFocusApiClient>(KEYS.FOCUS_API_CLIENT);
  }

  /**
   * 检查 Focus API Client 是否已注册
   */
  hasFocusApiClient(): boolean {
    return this.container.has(KEYS.FOCUS_API_CLIENT);
  }

  // ============ Repository (可选) ============

  /**
   * 注册 Goal Repository（本地存储）
   */
  registerRepository(repo: IGoalRepository): this {
    this.container.register(KEYS.REPOSITORY, repo);
    return this;
  }

  /**
   * 获取 Goal Repository
   */
  getRepository(): IGoalRepository {
    return this.container.resolve<IGoalRepository>(KEYS.REPOSITORY);
  }

  /**
   * 尝试获取 Repository，如果未注册返回 undefined
   */
  tryGetRepository(): IGoalRepository | undefined {
    return this.container.tryResolve<IGoalRepository>(KEYS.REPOSITORY);
  }

  /**
   * 检查 Repository 是否已注册
   */
  hasRepository(): boolean {
    return this.container.has(KEYS.REPOSITORY);
  }

  // ============ 通用方法 ============

  /**
   * 检查必需依赖是否已配置
   */
  isConfigured(): boolean {
    return this.hasApiClient() && this.hasFolderApiClient() && this.hasFocusApiClient();
  }

  /**
   * 清空 Goal 模块的所有依赖
   */
  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
    this.container.unregister(KEYS.FOLDER_API_CLIENT);
    this.container.unregister(KEYS.FOCUS_API_CLIENT);
    this.container.unregister(KEYS.REPOSITORY);
  }
}

/**
 * 导出依赖键（供高级用例使用）
 */
export { KEYS as GoalDependencyKeys };
