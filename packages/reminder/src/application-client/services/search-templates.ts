/**
 * Search Templates
 *
 * 搜索提醒模板用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * Search Templates
 */
export class SearchTemplates {
  private static instance: SearchTemplates;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): SearchTemplates {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    SearchTemplates.instance = new SearchTemplates(client);
    return SearchTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SearchTemplates {
    if (!SearchTemplates.instance) {
      SearchTemplates.instance = SearchTemplates.createInstance();
    }
    return SearchTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SearchTemplates.instance = undefined as unknown as SearchTemplates;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string, query: string): Promise<ReminderTemplate[]> {
    const templateDTOs = await this.apiClient.searchTemplates(accountUuid, query);
    return templateDTOs.map((dto) => ReminderTemplate.fromClientDTO(dto));
  }
}
