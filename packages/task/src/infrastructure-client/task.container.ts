/**
 * Task Container
 *
 * Task 模块的依赖容器，管理:
 * - TaskTemplate API Client
 * - TaskInstance API Client
 * - TaskDependency API Client
 * - TaskStatistics API Client
 * - Repositories (本地存储，可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { ITaskTemplateApiClient } from './ports/task-template-api-client.port';
import type { ITaskInstanceApiClient } from './ports/task-instance-api-client.port';
import type { ITaskDependencyApiClient } from './ports/task-dependency-api-client.port';
import type { ITaskStatisticsApiClient } from './ports/task-statistics-api-client.port';

/**
 * Task 模块依赖键
 */
const KEYS = {
  TEMPLATE_API_CLIENT: Symbol('TaskTemplateApiClient'),
  INSTANCE_API_CLIENT: Symbol('TaskInstanceApiClient'),
  DEPENDENCY_API_CLIENT: Symbol('TaskDependencyApiClient'),
  STATISTICS_API_CLIENT: Symbol('TaskStatisticsApiClient'),
  TEMPLATE_REPOSITORY: Symbol('TaskTemplateRepository'),
  INSTANCE_REPOSITORY: Symbol('TaskInstanceRepository'),
} as const;

/**
 * Task 仓储接口（本地存储）
 */
export interface ITaskTemplateRepository {
  // 后续根据需要扩展
}

export interface ITaskInstanceRepository {
  // 后续根据需要扩展
}

/**
 * Task 模块依赖容器
 */
export class TaskContainer extends ModuleContainerBase {
  private static instance: TaskContainer;

  private constructor() {
    super();
  }

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  static resetInstance(): void {
    TaskContainer.instance = undefined as unknown as TaskContainer;
  }

  // ============ Template API Client ============

  registerTemplateApiClient(client: ITaskTemplateApiClient): this {
    this.container.register(KEYS.TEMPLATE_API_CLIENT, client);
    return this;
  }

  getTemplateApiClient(): ITaskTemplateApiClient {
    return this.container.resolve<ITaskTemplateApiClient>(KEYS.TEMPLATE_API_CLIENT);
  }

  hasTemplateApiClient(): boolean {
    return this.container.has(KEYS.TEMPLATE_API_CLIENT);
  }

  // ============ Instance API Client ============

  registerInstanceApiClient(client: ITaskInstanceApiClient): this {
    this.container.register(KEYS.INSTANCE_API_CLIENT, client);
    return this;
  }

  getInstanceApiClient(): ITaskInstanceApiClient {
    return this.container.resolve<ITaskInstanceApiClient>(KEYS.INSTANCE_API_CLIENT);
  }

  hasInstanceApiClient(): boolean {
    return this.container.has(KEYS.INSTANCE_API_CLIENT);
  }

  // ============ Dependency API Client ============

  registerDependencyApiClient(client: ITaskDependencyApiClient): this {
    this.container.register(KEYS.DEPENDENCY_API_CLIENT, client);
    return this;
  }

  getDependencyApiClient(): ITaskDependencyApiClient {
    return this.container.resolve<ITaskDependencyApiClient>(KEYS.DEPENDENCY_API_CLIENT);
  }

  hasDependencyApiClient(): boolean {
    return this.container.has(KEYS.DEPENDENCY_API_CLIENT);
  }

  // ============ Statistics API Client ============

  registerStatisticsApiClient(client: ITaskStatisticsApiClient): this {
    this.container.register(KEYS.STATISTICS_API_CLIENT, client);
    return this;
  }

  getStatisticsApiClient(): ITaskStatisticsApiClient {
    return this.container.resolve<ITaskStatisticsApiClient>(KEYS.STATISTICS_API_CLIENT);
  }

  hasStatisticsApiClient(): boolean {
    return this.container.has(KEYS.STATISTICS_API_CLIENT);
  }

  // ============ Repositories (可选) ============

  registerTemplateRepository(repo: ITaskTemplateRepository): this {
    this.container.register(KEYS.TEMPLATE_REPOSITORY, repo);
    return this;
  }

  getTemplateRepository(): ITaskTemplateRepository {
    return this.container.resolve<ITaskTemplateRepository>(KEYS.TEMPLATE_REPOSITORY);
  }

  tryGetTemplateRepository(): ITaskTemplateRepository | undefined {
    return this.container.tryResolve<ITaskTemplateRepository>(KEYS.TEMPLATE_REPOSITORY);
  }

  registerInstanceRepository(repo: ITaskInstanceRepository): this {
    this.container.register(KEYS.INSTANCE_REPOSITORY, repo);
    return this;
  }

  getInstanceRepository(): ITaskInstanceRepository {
    return this.container.resolve<ITaskInstanceRepository>(KEYS.INSTANCE_REPOSITORY);
  }

  tryGetInstanceRepository(): ITaskInstanceRepository | undefined {
    return this.container.tryResolve<ITaskInstanceRepository>(KEYS.INSTANCE_REPOSITORY);
  }

  // ============ 通用方法 ============

  isConfigured(): boolean {
    return (
      this.hasTemplateApiClient() &&
      this.hasInstanceApiClient() &&
      this.hasDependencyApiClient() &&
      this.hasStatisticsApiClient()
    );
  }

  clear(): void {
    this.container.unregister(KEYS.TEMPLATE_API_CLIENT);
    this.container.unregister(KEYS.INSTANCE_API_CLIENT);
    this.container.unregister(KEYS.DEPENDENCY_API_CLIENT);
    this.container.unregister(KEYS.STATISTICS_API_CLIENT);
    this.container.unregister(KEYS.TEMPLATE_REPOSITORY);
    this.container.unregister(KEYS.INSTANCE_REPOSITORY);
  }
}

export { KEYS as TaskDependencyKeys };
