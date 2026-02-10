/**
 * Get User Reminder Groups
 *
 * 获取指定用户的所有提醒分组用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { ReminderGroup } from '@/domain-client';
import { ReminderContainer } from '@/infrastructure-client';

/**
 * Get User Reminder Groups
 */
export class GetUserReminderGroups {
  private static instance: GetUserReminderGroups;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetUserReminderGroups {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUserReminderGroups.instance = new GetUserReminderGroups(client);
    return GetUserReminderGroups.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetUserReminderGroups {
    if (!GetUserReminderGroups.instance) {
      GetUserReminderGroups.instance = GetUserReminderGroups.createInstance();
    }
    return GetUserReminderGroups.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUserReminderGroups.instance = undefined as unknown as GetUserReminderGroups;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<ReminderGroup[]> {
    const groupDTOs = await this.apiClient.getUserReminderGroups(accountUuid);
    return groupDTOs.map((dto) => ReminderGroup.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const getUserReminderGroups = (accountUuid: string): Promise<ReminderGroup[]> =>
  GetUserReminderGroups.getInstance().execute(accountUuid);
