/**
 * List Schedule Tasks
 *
 * 获取调度任务列表用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleTask } from '@dailyuse/domain-client/schedule';

/**
 * List Schedule Tasks
 */
export class ListScheduleTasks {
  private static instance: ListScheduleTasks;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): ListScheduleTasks {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    ListScheduleTasks.instance = new ListScheduleTasks(client);
    return ListScheduleTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListScheduleTasks {
    if (!ListScheduleTasks.instance) {
      ListScheduleTasks.instance = ListScheduleTasks.createInstance();
    }
    return ListScheduleTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListScheduleTasks.instance = undefined as unknown as ListScheduleTasks;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(): Promise<{ tasks: ScheduleTask[]; total: number }> {
    const result = await this.apiClient.getTasks();
    // 如果返回的是数组，包装成响应对象
    const dtos = Array.isArray(result) ? result : result.tasks;
    const total = Array.isArray(result) ? result.length : result.total;
    return { 
      tasks: dtos.map(dto => ScheduleTask.fromClientDTO(dto)), 
      total 
    };
  }
}

/**
 * 便捷函数
 */
export const listScheduleTasks = (): Promise<{ tasks: ScheduleTask[]; total: number }> =>
  ListScheduleTasks.getInstance().execute();
