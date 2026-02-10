/**
 * Reminder Container
 *
 * Reminder 模块的依赖容器，管理:
 * - Reminder API Client
 * - Repository (本地存储，可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IReminderApiClient } from './ports/reminder-api-client.port';

/**
 * Reminder 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('ReminderApiClient'),
  REPOSITORY: Symbol('ReminderRepository'),
} as const;

/**
 * Reminder 仓储接口（本地存储）
 */
export interface IReminderRepository {
  // 后续根据需要扩展
}

/**
 * Reminder 模块依赖容器
 */
export class ReminderContainer extends ModuleContainerBase {
  private static instance: ReminderContainer;

  private constructor() {
    super();
  }

  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  static resetInstance(): void {
    ReminderContainer.instance = undefined as unknown as ReminderContainer;
  }

  // ============ API Client ============

  registerApiClient(client: IReminderApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  getApiClient(): IReminderApiClient {
    return this.container.resolve<IReminderApiClient>(KEYS.API_CLIENT);
  }

  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ Repository (可选) ============

  registerRepository(repo: IReminderRepository): this {
    this.container.register(KEYS.REPOSITORY, repo);
    return this;
  }

  getRepository(): IReminderRepository {
    return this.container.resolve<IReminderRepository>(KEYS.REPOSITORY);
  }

  tryGetRepository(): IReminderRepository | undefined {
    return this.container.tryResolve<IReminderRepository>(KEYS.REPOSITORY);
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

export { KEYS as ReminderDependencyKeys };
