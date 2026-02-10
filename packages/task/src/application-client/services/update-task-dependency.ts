/**
 * Update Task Dependency
 *
 * 更新任务依赖关系用例
 */

import type { ITaskDependencyApiClient } from '@/infrastructure-client';
import type {
  UpdateTaskDependencyRequest,
  TaskDependencyClientDTO,
} from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@/infrastructure-client';
import { TaskDependencyEvents } from './task-dependency-events';

/**
 * Update Task Dependency
 */
export class UpdateTaskDependency {
  private static instance: UpdateTaskDependency;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): UpdateTaskDependency {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    UpdateTaskDependency.instance = new UpdateTaskDependency(client);
    return UpdateTaskDependency.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateTaskDependency {
    if (!UpdateTaskDependency.instance) {
      UpdateTaskDependency.instance = UpdateTaskDependency.createInstance();
    }
    return UpdateTaskDependency.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateTaskDependency.instance = undefined as unknown as UpdateTaskDependency;
  }

  /**
   * 执行用例
   */
  async execute(
    uuid: string,
    taskUuid: string,
    request: UpdateTaskDependencyRequest,
  ): Promise<TaskDependencyClientDTO> {
    const dependency = await this.apiClient.updateDependency(uuid, request);

    eventBus.emit(TaskDependencyEvents.DEPENDENCY_UPDATED, {
      taskUuid,
      dependencyUuid: uuid,
      reason: TaskDependencyEvents.DEPENDENCY_UPDATED,
      timestamp: Date.now(),
    });

    return dependency;
  }
}
