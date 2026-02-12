/**
 * Reminder Statistics Application Service
 *
 * 提醒统计应用服务 - 负责统计数据查询
 */

import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';
import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';

/**
 * Reminder Statistics Application Service
 */
export class ReminderStatisticsApplicationService {
  constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 获取提醒统计数据
   */
  async getReminderStatistics(accountUuid: string): Promise<ReminderStatisticsClientDTO> {
    return this.apiClient.getReminderStatistics(accountUuid);
  }
}

/**
 * Factory function to create ReminderStatisticsApplicationService
 */
export function createReminderStatisticsApplicationService(
  apiClient: IReminderApiClient,
): ReminderStatisticsApplicationService {
  return new ReminderStatisticsApplicationService(apiClient);
}
