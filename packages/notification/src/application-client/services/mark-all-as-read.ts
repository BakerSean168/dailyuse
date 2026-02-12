/**
 * Mark All As Read
 *
 * 标记所有通知为已读用例
 */

import type { INotificationApiClient } from '../../infrastructure-client/adapters/types';
import { NotificationContainer } from '../../infrastructure-client/notification.container';
import type { CountResult } from '@dailyuse/contracts/result';

/**
 * Mark All As Read
 */
export class MarkAllAsRead {
  private static instance: MarkAllAsRead;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): MarkAllAsRead {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    MarkAllAsRead.instance = new MarkAllAsRead(client);
    return MarkAllAsRead.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): MarkAllAsRead {
    if (!MarkAllAsRead.instance) {
      MarkAllAsRead.instance = MarkAllAsRead.createInstance();
    }
    return MarkAllAsRead.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    MarkAllAsRead.instance = undefined as unknown as MarkAllAsRead;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<CountResult> {
    return this.apiClient.markAllAsRead();
  }
}
