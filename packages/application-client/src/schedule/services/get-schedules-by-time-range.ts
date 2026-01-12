/**
 * Get Schedules By Time Range
 *
 * 获取指定时间范围内的日程事件用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { GetSchedulesByTimeRangeRequest } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { Schedule } from '@dailyuse/domain-client/schedule';

/**
 * Get Schedules By Time Range Input
 */
export type GetSchedulesByTimeRangeInput = GetSchedulesByTimeRangeRequest;

/**
 * Get Schedules By Time Range
 */
export class GetSchedulesByTimeRange {
  private static instance: GetSchedulesByTimeRange;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): GetSchedulesByTimeRange {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getEventApiClient();
    GetSchedulesByTimeRange.instance = new GetSchedulesByTimeRange(client);
    return GetSchedulesByTimeRange.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSchedulesByTimeRange {
    if (!GetSchedulesByTimeRange.instance) {
      GetSchedulesByTimeRange.instance = GetSchedulesByTimeRange.createInstance();
    }
    return GetSchedulesByTimeRange.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSchedulesByTimeRange.instance = undefined as unknown as GetSchedulesByTimeRange;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(input: GetSchedulesByTimeRangeInput): Promise<Schedule[]> {
    const dtos = await this.apiClient.getSchedulesByTimeRange(input);
    return dtos.map(dto => Schedule.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const getSchedulesByTimeRange = (input: GetSchedulesByTimeRangeInput): Promise<Schedule[]> =>
  GetSchedulesByTimeRange.getInstance().execute(input);
