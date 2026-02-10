/**
 * Get Reminder Group
 *
 * 获取提醒分组详情用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { ReminderGroup } from '@/domain-client';
import { ReminderContainer } from '@/infrastructure-client';

/**
 * Get Reminder Group
 */
export class GetReminderGroup {
  private static instance: GetReminderGroup;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetReminderGroup {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetReminderGroup.instance = new GetReminderGroup(client);
    return GetReminderGroup.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetReminderGroup {
    if (!GetReminderGroup.instance) {
      GetReminderGroup.instance = GetReminderGroup.createInstance();
    }
    return GetReminderGroup.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetReminderGroup.instance = undefined as unknown as GetReminderGroup;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ReminderGroup> {
    const groupDTO = await this.apiClient.getReminderGroup(uuid);
    return ReminderGroup.fromClientDTO(groupDTO);
  }
}

/**
 * 便捷函数
 */
export const getReminderGroup = (uuid: string): Promise<ReminderGroup> =>
  GetReminderGroup.getInstance().execute(uuid);
