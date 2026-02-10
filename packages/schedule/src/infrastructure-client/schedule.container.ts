/**
 * Schedule Container
 *
 * Schedule 模块的依赖容器，管理:
 * - ScheduleTask API Client
 * - ScheduleEvent API Client
 * - Repositories (本地存储，可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IScheduleTaskApiClient } from './ports/schedule-task-api-client.port';
import type { IScheduleEventApiClient } from './ports/schedule-event-api-client.port';

/**
 * Schedule 模块依赖键
 */
const KEYS = {
  TASK_API_CLIENT: Symbol('ScheduleTaskApiClient'),
  EVENT_API_CLIENT: Symbol('ScheduleEventApiClient'),
  TASK_REPOSITORY: Symbol('ScheduleTaskRepository'),
  EVENT_REPOSITORY: Symbol('ScheduleEventRepository'),
} as const;

/**
 * Schedule 仓储接口（本地存储）
 */
export interface IScheduleTaskRepository {
  // 后续根据需要扩展
}

export interface IScheduleEventRepository {
  // 后续根据需要扩展
}

/**
 * Schedule 模块依赖容器
 */
export class ScheduleContainer extends ModuleContainerBase {
  private static instance: ScheduleContainer;

  private constructor() {
    super();
  }

  static getInstance(): ScheduleContainer {
    if (!ScheduleContainer.instance) {
      ScheduleContainer.instance = new ScheduleContainer();
    }
    return ScheduleContainer.instance;
  }

  static resetInstance(): void {
    ScheduleContainer.instance = undefined as unknown as ScheduleContainer;
  }

  // ============ Task API Client ============

  registerTaskApiClient(client: IScheduleTaskApiClient): this {
    this.container.register(KEYS.TASK_API_CLIENT, client);
    return this;
  }

  getTaskApiClient(): IScheduleTaskApiClient {
    return this.container.resolve<IScheduleTaskApiClient>(KEYS.TASK_API_CLIENT);
  }

  hasTaskApiClient(): boolean {
    return this.container.has(KEYS.TASK_API_CLIENT);
  }

  // ============ Event API Client ============

  registerEventApiClient(client: IScheduleEventApiClient): this {
    this.container.register(KEYS.EVENT_API_CLIENT, client);
    return this;
  }

  getEventApiClient(): IScheduleEventApiClient {
    return this.container.resolve<IScheduleEventApiClient>(KEYS.EVENT_API_CLIENT);
  }

  hasEventApiClient(): boolean {
    return this.container.has(KEYS.EVENT_API_CLIENT);
  }

  // ============ Repositories (可选) ============

  registerTaskRepository(repo: IScheduleTaskRepository): this {
    this.container.register(KEYS.TASK_REPOSITORY, repo);
    return this;
  }

  getTaskRepository(): IScheduleTaskRepository {
    return this.container.resolve<IScheduleTaskRepository>(KEYS.TASK_REPOSITORY);
  }

  tryGetTaskRepository(): IScheduleTaskRepository | undefined {
    return this.container.tryResolve<IScheduleTaskRepository>(KEYS.TASK_REPOSITORY);
  }

  registerEventRepository(repo: IScheduleEventRepository): this {
    this.container.register(KEYS.EVENT_REPOSITORY, repo);
    return this;
  }

  getEventRepository(): IScheduleEventRepository {
    return this.container.resolve<IScheduleEventRepository>(KEYS.EVENT_REPOSITORY);
  }

  tryGetEventRepository(): IScheduleEventRepository | undefined {
    return this.container.tryResolve<IScheduleEventRepository>(KEYS.EVENT_REPOSITORY);
  }

  // ============ 通用方法 ============

  isConfigured(): boolean {
    return this.hasTaskApiClient() && this.hasEventApiClient();
  }

  clear(): void {
    this.container.unregister(KEYS.TASK_API_CLIENT);
    this.container.unregister(KEYS.EVENT_API_CLIENT);
    this.container.unregister(KEYS.TASK_REPOSITORY);
    this.container.unregister(KEYS.EVENT_REPOSITORY);
  }
}

export { KEYS as ScheduleDependencyKeys };
