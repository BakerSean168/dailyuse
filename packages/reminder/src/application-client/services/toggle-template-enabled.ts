/**
 * Toggle Template Enabled
 *
 * 切换提醒模板启用状态用例
 */

import type { IReminderApiClient } from '@/infrastructure-client';
import { ReminderTemplate } from '@/domain-client';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '@/infrastructure-client';
import { ReminderTemplateEvents, type ReminderTemplateRefreshEvent } from './reminder-events';

/**
 * Toggle Template Enabled
 */
export class ToggleTemplateEnabled {
  private static instance: ToggleTemplateEnabled;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): ToggleTemplateEnabled {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ToggleTemplateEnabled.instance = new ToggleTemplateEnabled(client);
    return ToggleTemplateEnabled.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ToggleTemplateEnabled {
    if (!ToggleTemplateEnabled.instance) {
      ToggleTemplateEnabled.instance = ToggleTemplateEnabled.createInstance();
    }
    return ToggleTemplateEnabled.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ToggleTemplateEnabled.instance = undefined as unknown as ToggleTemplateEnabled;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ReminderTemplate> {
    const templateDTO = await this.apiClient.toggleTemplateEnabled(uuid);
    const template = ReminderTemplate.fromClientDTO(templateDTO);

    const eventName = template.selfEnabled
      ? ReminderTemplateEvents.TEMPLATE_ENABLED
      : ReminderTemplateEvents.TEMPLATE_DISABLED;
    this.publishEvent(template.uuid, eventName);

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

/**
 * 便捷函数
 */
export const toggleTemplateEnabled = (uuid: string): Promise<ReminderTemplate> =>
  ToggleTemplateEnabled.getInstance().execute(uuid);
