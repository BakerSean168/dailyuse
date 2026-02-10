/**
 * Toggle Reminder Group Control Mode
 *
 * 切换提醒分组控制模式用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { ReminderGroup } from '@/domain-client';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@/infrastructure-client';
import { ReminderGroupEvents, type ReminderGroupRefreshEvent } from './reminder-events';

/**
 * Toggle Reminder Group Control Mode
 */
export class ToggleReminderGroupControlMode {
  private static instance: ToggleReminderGroupControlMode;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): ToggleReminderGroupControlMode {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ToggleReminderGroupControlMode.instance = new ToggleReminderGroupControlMode(client);
    return ToggleReminderGroupControlMode.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ToggleReminderGroupControlMode {
    if (!ToggleReminderGroupControlMode.instance) {
      ToggleReminderGroupControlMode.instance = ToggleReminderGroupControlMode.createInstance();
    }
    return ToggleReminderGroupControlMode.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ToggleReminderGroupControlMode.instance = undefined as unknown as ToggleReminderGroupControlMode;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ReminderGroup> {
    const groupDTO = await this.apiClient.toggleReminderGroupControlMode(uuid);
    const group = ReminderGroup.fromClientDTO(groupDTO);

    this.publishEvent(group.uuid, ReminderGroupEvents.GROUP_CONTROL_MODE_TOGGLED);

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
export const toggleReminderGroupControlMode = (uuid: string): Promise<ReminderGroup> =>
  ToggleReminderGroupControlMode.getInstance().execute(uuid);
