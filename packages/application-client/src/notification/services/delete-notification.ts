/**
 * Delete Notification
 *
 * 删除通知用例
 */

import type { INotificationApiClient } from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '@dailyuse/infrastructure-client';
import type { ActionResult } from '@dailyuse/contracts/result';

/**
 * Delete Notification
 */
export class DeleteNotification {
  private static instance: DeleteNotification;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): DeleteNotification {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteNotification.instance = new DeleteNotification(client);
    return DeleteNotification.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteNotification {
    if (!DeleteNotification.instance) {
      DeleteNotification.instance = DeleteNotification.createInstance();
    }
    return DeleteNotification.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteNotification.instance = undefined as unknown as DeleteNotification;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ActionResult> {
    return this.apiClient.deleteNotification(uuid);
  }
}
