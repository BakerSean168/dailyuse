/**
 * List Task Instances
 *
 * 获取任务实例列表用例
 */

import type { ITaskInstanceApiClient } from '@dailyuse/infrastructure-client';
import { TaskInstance } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * List Task Instances
 */
export class ListTaskInstances {
  private static instance: ListTaskInstances;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): ListTaskInstances {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    ListTaskInstances.instance = new ListTaskInstances(client);
    return ListTaskInstances.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListTaskInstances {
    if (!ListTaskInstances.instance) {
      ListTaskInstances.instance = ListTaskInstances.createInstance();
    }
    return ListTaskInstances.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListTaskInstances.instance = undefined as unknown as ListTaskInstances;
  }

  /**
   * 执行用例
   */
  async execute(params?: {
    page?: number;
    limit?: number;
    templateUuid?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<TaskInstance[]> {
    const instanceDTOs = await this.apiClient.getTaskInstances(params);
    return instanceDTOs.map(dto => TaskInstance.fromClientDTO(dto));
  }
}
