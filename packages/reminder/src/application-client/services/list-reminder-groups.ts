/**
 * List Reminder Groups
 *
 * 获取提醒分组列表用例
 */

import type { IReminderApiClient, ReminderGroupsResponse } from '@/infrastructure-client';
import { ReminderGroup } from '@/domain-client';
import { ReminderContainer } from '@/infrastructure-client';

/**
 * List Reminder Groups Params
 */
export interface ListReminderGroupsParams {
  page?: number;
  limit?: number;
}

/**
 * List Reminder Groups Result
 */
export interface ListReminderGroupsResult {
  groups: ReminderGroup[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * List Reminder Groups
 */
export class ListReminderGroups {
  private static instance: ListReminderGroups;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): ListReminderGroups {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ListReminderGroups.instance = new ListReminderGroups(client);
    return ListReminderGroups.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListReminderGroups {
    if (!ListReminderGroups.instance) {
      ListReminderGroups.instance = ListReminderGroups.createInstance();
    }
    return ListReminderGroups.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListReminderGroups.instance = undefined as unknown as ListReminderGroups;
  }

  /**
   * 执行用例
   */
  async execute(params?: ListReminderGroupsParams): Promise<ListReminderGroupsResult> {
    const response: ReminderGroupsResponse = await this.apiClient.getReminderGroups(params);
    return {
      groups: response.groups.map((dto) => ReminderGroup.fromClientDTO(dto)),
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
export const listReminderGroups = (params?: ListReminderGroupsParams): Promise<ListReminderGroupsResult> =>
  ListReminderGroups.getInstance().execute(params);
