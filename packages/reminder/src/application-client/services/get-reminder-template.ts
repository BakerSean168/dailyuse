/**
 * Get Reminder Template
 *
 * 获取提醒模板详情用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * Get Reminder Template
 */
export class GetReminderTemplate {
  private static instance: GetReminderTemplate;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetReminderTemplate {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetReminderTemplate.instance = new GetReminderTemplate(client);
    return GetReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetReminderTemplate {
    if (!GetReminderTemplate.instance) {
      GetReminderTemplate.instance = GetReminderTemplate.createInstance();
    }
    return GetReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetReminderTemplate.instance = undefined as unknown as GetReminderTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ReminderTemplate> {
    const templateDTO = await this.apiClient.getReminderTemplate(uuid);
    return ReminderTemplate.fromClientDTO(templateDTO);
  }
}

/**
 * 便捷函数
 */
export const getReminderTemplate = (uuid: string): Promise<ReminderTemplate> =>
  GetReminderTemplate.getInstance().execute(uuid);
