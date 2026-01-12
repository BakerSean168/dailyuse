/**
 * Get Task Instance
 *
 * 获取单个任务实例用例
 */

import type { ITaskInstanceApiClient } from '@dailyuse/infrastructure-client';
import { TaskInstance } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Task Instance
 */
export class GetTaskInstance {
  private static instance: GetTaskInstance;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): GetTaskInstance {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    GetTaskInstance.instance = new GetTaskInstance(client);
    return GetTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskInstance {
    if (!GetTaskInstance.instance) {
      GetTaskInstance.instance = GetTaskInstance.createInstance();
    }
    return GetTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskInstance.instance = undefined as unknown as GetTaskInstance;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.getTaskInstanceById(uuid);
    return TaskInstance.fromClientDTO(instanceDTO);
  }
}
