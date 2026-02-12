/**
 * Get Unread Count
 *
 * 获取未读通知数量用例
 */

import type { INotificationApiClient, UnreadCountResponse } from '../../infrastructure-client/adapters/types';
import { NotificationContainer } from '../../infrastructure-client/notification.container';

/**
 * Get Unread Count Output
 */
export type GetUnreadCountOutput = UnreadCountResponse;

/**
 * Get Unread Count
 */
export class GetUnreadCount {
  private static instance: GetUnreadCount;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): GetUnreadCount {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetUnreadCount.instance = new GetUnreadCount(client);
    return GetUnreadCount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetUnreadCount {
    if (!GetUnreadCount.instance) {
      GetUnreadCount.instance = GetUnreadCount.createInstance();
    }
    return GetUnreadCount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetUnreadCount.instance = undefined as unknown as GetUnreadCount;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<GetUnreadCountOutput> {
    return this.apiClient.getUnreadCount();
  }
}

/**
 * 便捷函数
 */
export const getUnreadCount = (): Promise<GetUnreadCountOutput> =>
  GetUnreadCount.getInstance().execute();
