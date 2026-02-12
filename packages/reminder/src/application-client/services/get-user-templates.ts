/**
 * Get User Templates
 *
 * 获取用户的所有提醒模板用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * Get User Templates
 */
export class GetUserTemplates {
  private static instance: GetUserTemplates;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): GetUserTemplates {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUserTemplates.instance = new GetUserTemplates(client);
    return GetUserTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetUserTemplates {
    if (!GetUserTemplates.instance) {
      GetUserTemplates.instance = GetUserTemplates.createInstance();
    }
    return GetUserTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUserTemplates.instance = undefined as unknown as GetUserTemplates;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<ReminderTemplate[]> {
    const templateDTOs = await this.apiClient.getUserTemplates(accountUuid);
    return templateDTOs.map((dto) => ReminderTemplate.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const getUserTemplates = (accountUuid: string): Promise<ReminderTemplate[]> =>
  GetUserTemplates.getInstance().execute(accountUuid);
