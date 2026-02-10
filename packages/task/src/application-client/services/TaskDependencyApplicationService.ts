/**
 * Task Dependency Application Service
 *
 * Handles task dependency management.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 职责：
 * - 依赖关系 CRUD
 * - 依赖验证
 * - 依赖链查询
 */

import type { ITaskDependencyApiClient } from '@/infrastructure-client';
import type {
  TaskDependencyClientDTO,
  CreateTaskDependencyRequest,
  UpdateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
  DependencyChainClientDTO,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

// Task Dependency Events
export const TaskDependencyEvents = {
  DEPENDENCY_CREATED: 'task:dependency:created',
  DEPENDENCY_UPDATED: 'task:dependency:updated',
  DEPENDENCY_DELETED: 'task:dependency:deleted',
} as const;

export interface TaskDependencyRefreshEvent {
  dependencyUuid?: string;
  taskUuid: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task Dependency Application Service
 */
export class TaskDependencyApplicationService {
  constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建任务依赖关系
   */
  async createDependency(
    taskUuid: string,
    request: CreateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    const dependency = await this.apiClient.createDependency(taskUuid, request);

    this.publishEvent(taskUuid, TaskDependencyEvents.DEPENDENCY_CREATED, {
      dependencyUuid: dependency.uuid,
      predecessorTaskUuid: request.predecessorTaskUuid,
    });

    return dependency;
  }

  /**
   * 获取任务的所有前置依赖
   */
  async getDependencies(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.apiClient.getDependencies(taskUuid);
  }

  /**
   * 获取依赖此任务的所有任务（后续任务）
   */
  async getDependents(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.apiClient.getDependents(taskUuid);
  }

  /**
   * 获取任务的完整依赖链信息
   */
  async getDependencyChain(taskUuid: string): Promise<DependencyChainClientDTO> {
    return this.apiClient.getDependencyChain(taskUuid);
  }

  /**
   * 验证依赖关系（不实际创建）
   */
  async validateDependency(
    request: ValidateDependencyRequest,
  ): Promise<ValidateDependencyResponse> {
    return this.apiClient.validateDependency(request);
  }

  /**
   * 删除依赖关系
   */
  async deleteDependency(uuid: string, taskUuid: string): Promise<void> {
    await this.apiClient.deleteDependency(uuid);

    this.publishEvent(taskUuid, TaskDependencyEvents.DEPENDENCY_DELETED, {
      dependencyUuid: uuid,
    });
  }

  /**
   * 更新依赖关系
   */
  async updateDependency(
    uuid: string,
    taskUuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    const dependency = await this.apiClient.updateDependency(uuid, request);

    this.publishEvent(taskUuid, TaskDependencyEvents.DEPENDENCY_UPDATED, {
      dependencyUuid: uuid,
    });

    return dependency;
  }

  // ===== 辅助方法 =====

  private publishEvent(
    taskUuid: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): void {
    const event: TaskDependencyRefreshEvent = {
      taskUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };

    eventBus.emit(eventName, event);
  }
}

/**
 * Factory function to create TaskDependencyApplicationService
 */
export function createTaskDependencyService(
  apiClient: ITaskDependencyApiClient,
): TaskDependencyApplicationService {
  return new TaskDependencyApplicationService(apiClient);
}
