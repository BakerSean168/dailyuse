/**
 * Delete Reminder Template
 *
 * 删除提醒模板用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@/infrastructure-client';
import { ReminderTemplateEvents, type ReminderTemplateRefreshEvent } from './reminder-events';

/**
 * Delete Reminder Template
 */
export class DeleteReminderTemplate {
  private static instance: DeleteReminderTemplate;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): DeleteReminderTemplate {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    DeleteReminderTemplate.instance = new DeleteReminderTemplate(client);
    return DeleteReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteReminderTemplate {
    if (!DeleteReminderTemplate.instance) {
      DeleteReminderTemplate.instance = DeleteReminderTemplate.createInstance();
    }
    return DeleteReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteReminderTemplate.instance = undefined as unknown as DeleteReminderTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteReminderTemplate(uuid);

    this.publishEvent(uuid, ReminderTemplateEvents.TEMPLATE_DELETED);
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

/**
 * 便捷函数
 */
export const deleteReminderTemplate = (uuid: string): Promise<void> =>
  DeleteReminderTemplate.getInstance().execute(uuid);
