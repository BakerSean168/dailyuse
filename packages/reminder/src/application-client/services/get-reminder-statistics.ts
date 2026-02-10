/**
 * Get Reminder Statistics
 *
 * 获取提醒统计数据用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '@/infrastructure-client';

/**
 * Get Reminder Statistics
 */
export class GetReminderStatistics {
  private static instance: GetReminderStatistics;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetReminderStatistics {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetReminderStatistics.instance = new GetReminderStatistics(client);
    return GetReminderStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetReminderStatistics {
    if (!GetReminderStatistics.instance) {
      GetReminderStatistics.instance = GetReminderStatistics.createInstance();
    }
    return GetReminderStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetReminderStatistics.instance = undefined as unknown as GetReminderStatistics;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    return this.apiClient.getReminderStatistics(accountUuid);
  }
}

/**
 * 便捷函数
 */
export const getReminderStatistics = (accountUuid: string): Promise<ReminderStatisticsClientDTO> =>
  GetReminderStatistics.getInstance().execute(accountUuid);
