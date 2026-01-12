/**
 * Create Notification
 *
 * 创建通知用例
 */

import type {
  INotificationApiClient,
  CreateNotificationRequest,
} from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '@dailyuse/infrastructure-client';
import { NotificationClient } from '@dailyuse/domain-client/notification';

/**
 * Create Notification Input
 */
export type CreateNotificationInput = CreateNotificationRequest;

/**
 * Create Notification
 */
export class CreateNotification {
  private static instance: CreateNotification;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): CreateNotification {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateNotification.instance = new CreateNotification(client);
    return CreateNotification.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateNotification {
    if (!CreateNotification.instance) {
      CreateNotification.instance = CreateNotification.createInstance();
    }
    return CreateNotification.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateNotification.instance = undefined as unknown as CreateNotification;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateNotificationInput): Promise<NotificationClient> {
    const dto = await this.apiClient.createNotification(input);
    return NotificationClient.fromClientDTO(dto);
  }
}

/**
 * 便捷函数
 */
export const createNotification = (input: CreateNotificationInput): Promise<NotificationClient> =>
  CreateNotification.getInstance().execute(input);
