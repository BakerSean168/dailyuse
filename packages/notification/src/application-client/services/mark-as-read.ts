/**
 * Mark As Read
 *
 * 标记通知为已读用例
 */

import type { INotificationApiClient } from '@/infrastructure-client';
import { NotificationContainer } from '@/infrastructure-client';
import { NotificationClient } from '@/domain-client';

/**
 * Mark As Read
 */
export class MarkAsRead {
  private static instance: MarkAsRead;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): MarkAsRead {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    MarkAsRead.instance = new MarkAsRead(client);
    return MarkAsRead.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): MarkAsRead {
    if (!MarkAsRead.instance) {
      MarkAsRead.instance = MarkAsRead.createInstance();
    }
    return MarkAsRead.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    MarkAsRead.instance = undefined as unknown as MarkAsRead;
  }

  /**
   * 执行用例
   * @returns NotificationClient Entity
   */
  async execute(uuid: string): Promise<NotificationClient> {
    const dto = await this.apiClient.markAsRead(uuid);
    return NotificationClient.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const markAsRead = (uuid: string): Promise<NotificationClient> =>
  MarkAsRead.getInstance().execute(uuid);
