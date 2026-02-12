/**
 * List Reminder Templates
 *
 * 获取提醒模板列表用例
 */

import type { IReminderApiClient, ReminderTemplatesResponse } from '../../infrastructure-client/adapters/types';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';

/**
 * List Reminder Templates Params
 */
export interface ListReminderTemplatesParams {
  page?: number;
  limit?: number;
}

/**
 * List Reminder Templates Result
 */
export interface ListReminderTemplatesResult {
  templates: ReminderTemplate[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * List Reminder Templates
 */
export class ListReminderTemplates {
  private static instance: ListReminderTemplates;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): ListReminderTemplates {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ListReminderTemplates.instance = new ListReminderTemplates(client);
    return ListReminderTemplates.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListReminderTemplates {
    if (!ListReminderTemplates.instance) {
      ListReminderTemplates.instance = ListReminderTemplates.createInstance();
    }
    return ListReminderTemplates.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListReminderTemplates.instance = undefined as unknown as ListReminderTemplates;
  }

  /**
   * 执行用例
   */
  async execute(params?: ListReminderTemplatesParams): Promise<ListReminderTemplatesResult> {
    const response: ReminderTemplatesResponse = await this.apiClient.getReminderTemplates(params);
    return {
      templates: response.templates.map((dto) => ReminderTemplate.fromClientDTO(dto)),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
    };
  }
}

/**
 * 便捷函数
 */
export const listReminderTemplates = (params?: ListReminderTemplatesParams): Promise<ListReminderTemplatesResult> =>
  ListReminderTemplates.getInstance().execute(params);
