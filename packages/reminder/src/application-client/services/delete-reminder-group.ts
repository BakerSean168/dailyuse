/**
 * Delete Reminder Group
 *
 * 删除提醒分组用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';
import { ReminderGroupEvents, type ReminderGroupRefreshEvent } from './reminder-events';

/**
 * Delete Reminder Group
 */
export class DeleteReminderGroup {
  private static instance: DeleteReminderGroup;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): DeleteReminderGroup {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteReminderGroup.instance = new DeleteReminderGroup(client);
    return DeleteReminderGroup.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteReminderGroup {
    if (!DeleteReminderGroup.instance) {
      DeleteReminderGroup.instance = DeleteReminderGroup.createInstance();
    }
    return DeleteReminderGroup.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteReminderGroup.instance = undefined as unknown as DeleteReminderGroup;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteReminderGroup(uuid);

    this.publishEvent(uuid, ReminderGroupEvents.GROUP_DELETED);
  }

  /**
   * 发布事件
   */
  private publishEvent(groupUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ReminderGroupRefreshEvent = {
      groupUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}

/**
 * 便捷函数
 */
export const deleteReminderGroup = (uuid: string): Promise<void> =>
  DeleteReminderGroup.getInstance().execute(uuid);
