/**
 * Notification Container
 *
 * Notification 模块的依赖容器，管理:
 * - Notification API Client
 * - Repository (本地存储，可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { INotificationApiClient } from './ports/notification-api-client.port';

/**
 * Notification 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('NotificationApiClient'),
  REPOSITORY: Symbol('NotificationRepository'),
} as const;

/**
 * Notification 仓储接口（本地存储）
 */
export interface INotificationRepository {
  // 后续根据需要扩展
}

/**
 * Notification 模块依赖容器
 */
export class NotificationContainer extends ModuleContainerBase {
  private static instance: NotificationContainer;

  private constructor() {
    super();
  }

  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  static resetInstance(): void {
    NotificationContainer.instance = undefined as unknown as NotificationContainer;
  }

  // ============ API Client ============

  registerApiClient(client: INotificationApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  getApiClient(): INotificationApiClient {
    return this.container.resolve<INotificationApiClient>(KEYS.API_CLIENT);
  }

  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ Repository (可选) ============

  registerRepository(repo: INotificationRepository): this {
    this.container.register(KEYS.REPOSITORY, repo);
    return this;
  }

  getRepository(): INotificationRepository {
    return this.container.resolve<INotificationRepository>(KEYS.REPOSITORY);
  }

  tryGetRepository(): INotificationRepository | undefined {
    return this.container.tryResolve<INotificationRepository>(KEYS.REPOSITORY);
  }

  hasRepository(): boolean {
    return this.container.has(KEYS.REPOSITORY);
  }

  // ============ 通用方法 ============

  isConfigured(): boolean {
    return this.hasApiClient();
  }

  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
    this.container.unregister(KEYS.REPOSITORY);
  }
}

export { KEYS as NotificationDependencyKeys };
