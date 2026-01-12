/**
 * List Schedules By Account
 *
 * 获取账户的所有日程事件用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { Schedule } from '@dailyuse/domain-client/schedule';

/**
 * List Schedules By Account
 */
export class ListSchedulesByAccount {
  private static instance: ListSchedulesByAccount;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): ListSchedulesByAccount {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    ListSchedulesByAccount.instance = new ListSchedulesByAccount(client);
    return ListSchedulesByAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListSchedulesByAccount {
    if (!ListSchedulesByAccount.instance) {
      ListSchedulesByAccount.instance = ListSchedulesByAccount.createInstance();
    }
    return ListSchedulesByAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListSchedulesByAccount.instance = undefined as unknown as ListSchedulesByAccount;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(): Promise<Schedule[]> {
    const dtos = await this.apiClient.getSchedulesByAccount();
    return dtos.map(dto => Schedule.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const listSchedulesByAccount = (): Promise<Schedule[]> =>
  ListSchedulesByAccount.getInstance().execute();
