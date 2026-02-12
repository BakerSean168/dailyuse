/**
 * Get Upcoming Reminders
 *
 * 获取即将到来的提醒用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import type { UpcomingRemindersResponseDTO } from '@dailyuse/contracts/reminder';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * Get Upcoming Reminders Params
 */
export interface GetUpcomingRemindersParams {
  days?: number;
  limit?: number;
  importanceLevel?: string;
  type?: string;
}

/**
 * Get Upcoming Reminders
 */
export class GetUpcomingReminders {
  private static instance: GetUpcomingReminders;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetUpcomingReminders {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUpcomingReminders.instance = new GetUpcomingReminders(client);
    return GetUpcomingReminders.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetUpcomingReminders {
    if (!GetUpcomingReminders.instance) {
      GetUpcomingReminders.instance = GetUpcomingReminders.createInstance();
    }
    return GetUpcomingReminders.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUpcomingReminders.instance = undefined as unknown as GetUpcomingReminders;
  }

  /**
   * 执行用例
   */
  async execute(params?: GetUpcomingRemindersParams): Promise<UpcomingRemindersResponseDTO> {
    return this.apiClient.getUpcomingReminders(params);
  }
}

/**
 * 便捷函数
 */
export const getUpcomingReminders = (params?: GetUpcomingRemindersParams): Promise<UpcomingRemindersResponseDTO> =>
  GetUpcomingReminders.getInstance().execute(params);
