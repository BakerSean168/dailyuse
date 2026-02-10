/**
 * Get Task Dependencies
 *
 * 获取任务的前置依赖用例
 */

import type { ITaskDependencyApiClient } from '@/infrastructure-client';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@/infrastructure-client';

/**
 * Get Task Dependencies
 */
export class GetTaskDependencies {
  private static instance: GetTaskDependencies;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): GetTaskDependencies {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    GetTaskDependencies.instance = new GetTaskDependencies(client);
    return GetTaskDependencies.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskDependencies {
    if (!GetTaskDependencies.instance) {
      GetTaskDependencies.instance = GetTaskDependencies.createInstance();
    }
    return GetTaskDependencies.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskDependencies.instance = undefined as unknown as GetTaskDependencies;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<TaskDependencyClientDTO[]> {
    return this.apiClient.getDependencies(taskUuid);
  }
}
