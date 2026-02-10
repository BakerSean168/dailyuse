/**
 * Toggle Reminder Group Status
 *
 * 切换提醒分组启用状态用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { ReminderGroup } from '@/domain-client';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@/infrastructure-client';
import { ReminderGroupEvents, type ReminderGroupRefreshEvent } from './reminder-events';

/**
 * Toggle Reminder Group Status
 */
export class ToggleReminderGroupStatus {
  private static instance: ToggleReminderGroupStatus;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): ToggleReminderGroupStatus {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ToggleReminderGroupStatus.instance = new ToggleReminderGroupStatus(client);
    return ToggleReminderGroupStatus.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ToggleReminderGroupStatus {
    if (!ToggleReminderGroupStatus.instance) {
      ToggleReminderGroupStatus.instance = ToggleReminderGroupStatus.createInstance();
    }
    return ToggleReminderGroupStatus.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ToggleReminderGroupStatus.instance = undefined as unknown as ToggleReminderGroupStatus;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ReminderGroup> {
    const groupDTO = await this.apiClient.toggleReminderGroupStatus(uuid);
    const group = ReminderGroup.fromClientDTO(groupDTO);

    this.publishEvent(group.uuid, ReminderGroupEvents.GROUP_STATUS_TOGGLED);

    return group;
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
export const toggleReminderGroupStatus = (uuid: string): Promise<ReminderGroup> =>
  ToggleReminderGroupStatus.getInstance().execute(uuid);
