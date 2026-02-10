/**
 * Update Reminder Group
 *
 * 更新提醒分组用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import type { UpdateReminderGroupRequest } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '@/domain-client';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@/infrastructure-client';
import { ReminderGroupEvents, type ReminderGroupRefreshEvent } from './reminder-events';

/**
 * Update Reminder Group
 */
export class UpdateReminderGroup {
  private static instance: UpdateReminderGroup;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): UpdateReminderGroup {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateReminderGroup.instance = new UpdateReminderGroup(client);
    return UpdateReminderGroup.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateReminderGroup {
    if (!UpdateReminderGroup.instance) {
      UpdateReminderGroup.instance = UpdateReminderGroup.createInstance();
    }
    return UpdateReminderGroup.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateReminderGroup.instance = undefined as unknown as UpdateReminderGroup;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, request: UpdateReminderGroupRequest): Promise<ReminderGroup> {
    const groupDTO = await this.apiClient.updateReminderGroup(uuid, request);
    const group = ReminderGroup.fromClientDTO(groupDTO);

    this.publishEvent(group.uuid, ReminderGroupEvents.GROUP_UPDATED);

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
