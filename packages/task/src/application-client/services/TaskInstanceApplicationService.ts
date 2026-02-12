/**
 * Task Instance Application Service
 *
 * Handles TaskInstance status management and operations.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 职责：
 * - TaskInstance 查询
 * - TaskInstance 状态管理（开始、完成、跳过）
 * - 批量操作
 */

import type { ITaskInstanceApiClient } from '../../infrastructure-client/adapters/types';
import type {
  TaskInstanceClientDTO,
  CompleteTaskInstanceRequest,
  SkipTaskInstanceRequest,
} from '@dailyuse/contracts/task';
import { TaskInstance } from '../../domain-client/aggregates/task-instance';
import { eventBus } from '@dailyuse/utils';

// Task Instance Events
export const TaskInstanceEvents = {
  INSTANCE_STARTED: 'task:instance:started',
  INSTANCE_COMPLETED: 'task:instance:completed',
  INSTANCE_SKIPPED: 'task:instance:skipped',
  INSTANCE_DELETED: 'task:instance:deleted',
  EXPIRED_CHECKED: 'task:instance:expired-checked',
} as const;

export interface TaskInstanceRefreshEvent {
  instanceUuid: string;
  templateUuid?: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Task Instance Application Service
 */
export class TaskInstanceApplicationService {
  constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  // ===== Task Instance 查询 =====

  /**
   * 获取任务实例列表
   */
  async getTaskInstances(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstance[]> {
    const instanceDTOs = await this.apiClient.getTaskInstances(params);
    return instanceDTOs.map((dto: TaskInstanceClientDTO) => TaskInstance.fromClientDTO(dto));
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.getTaskInstanceById(uuid);
    return TaskInstance.fromClientDTO(instanceDTO);
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await this.apiClient.deleteTaskInstance(uuid);

    this.publishEvent(uuid, TaskInstanceEvents.INSTANCE_DELETED);
  }

  // ===== Task Instance 状态管理 =====

  /**
   * 开始任务实例
   */
  async startTaskInstance(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.startTaskInstance(uuid);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    this.publishEvent(uuid, TaskInstanceEvents.INSTANCE_STARTED, {
      templateUuid: instance.templateUuid,
    });

    return instance;
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    request?: CompleteTaskInstanceRequest,
  ): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.completeTaskInstance(uuid, request);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    this.publishEvent(uuid, TaskInstanceEvents.INSTANCE_COMPLETED, {
      templateUuid: instance.templateUuid,
      duration: request?.duration,
      rating: request?.rating,
    });

    return instance;
  }

  /**
   * 跳过任务实例
   */
  async skipTaskInstance(uuid: string, request?: SkipTaskInstanceRequest): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.skipTaskInstance(uuid, request);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    this.publishEvent(uuid, TaskInstanceEvents.INSTANCE_SKIPPED, {
      templateUuid: instance.templateUuid,
      reason: request?.reason,
    });

    return instance;
  }

  // ===== 批量操作 =====

  /**
   * 检查并标记过期的任务实例
   */
  async checkExpiredInstances(): Promise<{
    count: number;
    instances: TaskInstance[];
  }> {
    const result = await this.apiClient.checkExpiredInstances();

    const instances = result.instances.map((dto: TaskInstanceClientDTO) =>
      TaskInstance.fromClientDTO(dto),
    );

    if (result.count > 0) {
      eventBus.emit(TaskInstanceEvents.EXPIRED_CHECKED, {
        count: result.count,
        timestamp: Date.now(),
      });
    }

    return {
      count: result.count,
      instances,
    };
  }

  // ===== 辅助方法 =====

  private publishEvent(
    instanceUuid: string,
    eventName: string,
    metadata?: Record<string, unknown>,
  ): void {
    const event: TaskInstanceRefreshEvent = {
      instanceUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };

    eventBus.emit(eventName, event);
  }
}

/**
 * Factory function to create TaskInstanceApplicationService
 */
export function createTaskInstanceService(
  apiClient: ITaskInstanceApiClient,
): TaskInstanceApplicationService {
  return new TaskInstanceApplicationService(apiClient);
}
