/**
 * Delete Task Dependency
 *
 * 删除任务依赖关系用例
 */

import type { ITaskDependencyApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '../../infrastructure-client/task.container';
import { TaskDependencyEvents } from './task-dependency-events';

/**
 * Delete Task Dependency
 */
export class DeleteTaskDependency {
  private static instance: DeleteTaskDependency;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): DeleteTaskDependency {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    DeleteTaskDependency.instance = new DeleteTaskDependency(client);
    return DeleteTaskDependency.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteTaskDependency {
    if (!DeleteTaskDependency.instance) {
      DeleteTaskDependency.instance = DeleteTaskDependency.createInstance();
    }
    return DeleteTaskDependency.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteTaskDependency.instance = undefined as unknown as DeleteTaskDependency;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, taskUuid: string): Promise<void> {
    await this.apiClient.deleteDependency(uuid);

    eventBus.emit(TaskDependencyEvents.DEPENDENCY_DELETED, {
      taskUuid,
      dependencyUuid: uuid,
      reason: TaskDependencyEvents.DEPENDENCY_DELETED,
      timestamp: Date.now(),
    });
  }
}
