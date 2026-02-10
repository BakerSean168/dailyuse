/**
 * Batch Delete Notifications
 *
 * 批量删除通知用例
 */

import type { INotificationApiClient } from '@/infrastructure-client';
import { NotificationContainer } from '@/infrastructure-client';
import type { CountResult } from '@dailyuse/contracts/result';

/**
 * Batch Delete Notifications
 */
export class BatchDeleteNotifications {
  private static instance: BatchDeleteNotifications;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): BatchDeleteNotifications {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    BatchDeleteNotifications.instance = new BatchDeleteNotifications(client);
    return BatchDeleteNotifications.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): BatchDeleteNotifications {
    if (!BatchDeleteNotifications.instance) {
      BatchDeleteNotifications.instance = BatchDeleteNotifications.createInstance();
    }
    return BatchDeleteNotifications.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    BatchDeleteNotifications.instance = undefined as unknown as BatchDeleteNotifications;
  }

  /**
   * 执行用例
   */
  async execute(uuids: string[]): Promise<CountResult> {
    return this.apiClient.batchDeleteNotifications(uuids);
  }
}
