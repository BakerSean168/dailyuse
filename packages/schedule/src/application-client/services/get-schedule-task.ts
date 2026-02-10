/**
 * Get Schedule Task
 *
 * 获取调度任务详情用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleTaskApiClient } from '@/infrastructure-client';
import { ScheduleContainer } from '@/infrastructure-client';
import { ScheduleTask } from '@/domain-client';

/**
 * Get Schedule Task
 */
export class GetScheduleTask {
  private static instance: GetScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    GetScheduleTask.instance = new GetScheduleTask(client);
    return GetScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleTask {
    if (!GetScheduleTask.instance) {
      GetScheduleTask.instance = GetScheduleTask.createInstance();
    }
    return GetScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleTask.instance = undefined as unknown as GetScheduleTask;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(taskUuid: string): Promise<ScheduleTask> {
    const dto = await this.apiClient.getTaskById(taskUuid);
    return ScheduleTask.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const getScheduleTask = (taskUuid: string): Promise<ScheduleTask> =>
  GetScheduleTask.getInstance().execute(taskUuid);
