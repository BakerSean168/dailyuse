/**
 * Get Due Tasks
 *
 * 获取到期任务用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleTaskApiClient } from '../../infrastructure-client/adapters/types';
import { ScheduleContainer } from '../../infrastructure-client/schedule.container';
import { ScheduleTask } from '../../domain-client/aggregates/schedule-task';

/**
 * Get Due Tasks
 */
export class GetDueTasks {
  private static instance: GetDueTasks;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetDueTasks {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetDueTasks.instance = new GetDueTasks(client);
    return GetDueTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDueTasks {
    if (!GetDueTasks.instance) {
      GetDueTasks.instance = GetDueTasks.createInstance();
    }
    return GetDueTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDueTasks.instance = undefined as unknown as GetDueTasks;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(beforeTime?: string, limit?: number): Promise<ScheduleTask[]> {
    const dtos = await this.apiClient.getDueTasks({ beforeTime, limit });
    return dtos.map(dto => ScheduleTask.fromClientDTO(dto));
  }
}
