/**
 * List Schedule Tasks
 *
 * 获取调度任务列表用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';

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
   */
  async execute(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    const result = await this.apiClient.getTasks();
    // 如果返回的是数组，包装成响应对象
    if (Array.isArray(result)) {
      return { tasks: result, total: result.length };
    }
    return result;
  }
}

/**
 * 便捷函数
 */
export const listScheduleTasks = (): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> =>
  ListScheduleTasks.getInstance().execute();
