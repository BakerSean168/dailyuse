/**
 * Create Reminder Group
 *
 * 创建提醒分组用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import type { CreateReminderGroupRequest } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '../../domain-client/aggregates/reminder-group';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';
import { ReminderGroupEvents, type ReminderGroupRefreshEvent } from './reminder-events';

/**
 * Create Reminder Group Input
 */
export type CreateReminderGroupInput = CreateReminderGroupRequest;

/**
 * Create Reminder Group
 */
export class CreateReminderGroup {
  private static instance: CreateReminderGroup;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): CreateReminderGroup {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateReminderGroup.instance = new CreateReminderGroup(client);
    return CreateReminderGroup.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateReminderGroup {
    if (!CreateReminderGroup.instance) {
      CreateReminderGroup.instance = CreateReminderGroup.createInstance();
    }
    return CreateReminderGroup.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateReminderGroup.instance = undefined as unknown as CreateReminderGroup;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateReminderGroupInput): Promise<ReminderGroup> {
    const groupDTO = await this.apiClient.createReminderGroup(input);
    const group = ReminderGroup.fromClientDTO(groupDTO);

    this.publishEvent(group.uuid, ReminderGroupEvents.GROUP_CREATED);

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
export const createReminderGroup = (input: CreateReminderGroupInput): Promise<ReminderGroup> =>
  CreateReminderGroup.getInstance().execute(input);
