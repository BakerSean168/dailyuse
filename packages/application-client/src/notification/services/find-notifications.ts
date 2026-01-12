/**
 * Find Notifications
 *
 * 查询通知列表用例
 */

import type {
  INotificationApiClient,
  QueryNotificationsRequest,
} from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '@dailyuse/infrastructure-client';
import { NotificationClient } from '@dailyuse/domain-client/notification';

/**
 * Find Notifications Input
 */
export type FindNotificationsInput = QueryNotificationsRequest;

/**
 * Find Notifications Output
 */
export interface FindNotificationsOutput {
  notifications: NotificationClient[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Find Notifications
 */
export class FindNotifications {
  private static instance: FindNotifications;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): FindNotifications {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    FindNotifications.instance = new FindNotifications(client);
    return FindNotifications.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): FindNotifications {
    if (!FindNotifications.instance) {
      FindNotifications.instance = FindNotifications.createInstance();
    }
    return FindNotifications.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    FindNotifications.instance = undefined as unknown as FindNotifications;
  }

  /**
   * 执行用例
   */
  async execute(input: FindNotificationsInput = {}): Promise<FindNotificationsOutput> {
    const response = await this.apiClient.findNotifications(input);
    return {
      notifications: response.notifications.map((dto) => NotificationClient.fromClientDTO(dto)),
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
export const findNotifications = (input: FindNotificationsInput = {}): Promise<FindNotificationsOutput> =>
  FindNotifications.getInstance().execute(input);
