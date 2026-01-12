/**
 * Get Task Dependents
 *
 * 获取依赖此任务的后续任务用例
 */

import type { ITaskDependencyApiClient } from '@dailyuse/infrastructure-client';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Task Dependents
 */
export class GetTaskDependents {
  private static instance: GetTaskDependents;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): GetTaskDependents {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    GetTaskDependents.instance = new GetTaskDependents(client);
    return GetTaskDependents.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskDependents {
    if (!GetTaskDependents.instance) {
      GetTaskDependents.instance = GetTaskDependents.createInstance();
    }
    return GetTaskDependents.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskDependents.instance = undefined as unknown as GetTaskDependents;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.apiClient.getDependents(taskUuid);
  }
}
