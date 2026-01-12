/**
 * Update Reminder Template
 *
 * 更新提醒模板用例
 */

import type { IReminderApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '@dailyuse/domain-client/reminder';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@dailyuse/infrastructure-client';
import { ReminderTemplateEvents, type ReminderTemplateRefreshEvent } from './reminder-events';

/**
 * Update Reminder Template
 */
export class UpdateReminderTemplate {
  private static instance: UpdateReminderTemplate;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): UpdateReminderTemplate {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateReminderTemplate.instance = new UpdateReminderTemplate(client);
    return UpdateReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateReminderTemplate {
    if (!UpdateReminderTemplate.instance) {
      UpdateReminderTemplate.instance = UpdateReminderTemplate.createInstance();
    }
    return UpdateReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateReminderTemplate.instance = undefined as unknown as UpdateReminderTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, request: UpdateReminderTemplateRequest): Promise<ReminderTemplate> {
    const templateDTO = await this.apiClient.updateReminderTemplate(uuid, request);
    const template = ReminderTemplate.fromClientDTO(templateDTO);

    this.publishEvent(template.uuid, ReminderTemplateEvents.TEMPLATE_UPDATED);

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
