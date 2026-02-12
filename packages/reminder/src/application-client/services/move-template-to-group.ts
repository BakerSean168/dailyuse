/**
 * Move Template To Group
 *
 * 移动提醒模板到指定分组用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';
import { ReminderTemplateEvents, type ReminderTemplateRefreshEvent } from './reminder-events';

/**
 * Move Template To Group
 */
export class MoveTemplateToGroup {
  private static instance: MoveTemplateToGroup;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): MoveTemplateToGroup {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    MoveTemplateToGroup.instance = new MoveTemplateToGroup(client);
    return MoveTemplateToGroup.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): MoveTemplateToGroup {
    if (!MoveTemplateToGroup.instance) {
      MoveTemplateToGroup.instance = MoveTemplateToGroup.createInstance();
    }
    return MoveTemplateToGroup.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    MoveTemplateToGroup.instance = undefined as unknown as MoveTemplateToGroup;
  }

  /**
   * 执行用例
   */
  async execute(templateUuid: string, targetGroupUuid: string | null): Promise<ReminderTemplate> {
    const templateDTO = await this.apiClient.moveTemplateToGroup(templateUuid, targetGroupUuid);
    const template = ReminderTemplate.fromClientDTO(templateDTO);

    this.publishEvent(template.uuid, ReminderTemplateEvents.TEMPLATE_MOVED, {
      targetGroupUuid,
    });

    return template;
  }

  /**
   * 发布事件
   */
  private publishEvent(templateUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ReminderTemplateRefreshEvent = {
      templateUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}
