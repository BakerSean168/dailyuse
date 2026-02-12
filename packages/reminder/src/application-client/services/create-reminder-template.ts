/**
 * Create Reminder Template
 *
 * 创建提醒模板用例
 */

import type { IReminderApiClient } from '../../infrastructure-client/adapters/types';
import type { CreateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { ReminderTemplate } from '../../domain-client/aggregates/reminder-template';
import { eventBus } from '@dailyuse/utils';
import { ReminderContainer } from '../../infrastructure-client/reminder.container';
import { ReminderTemplateEvents, type ReminderTemplateRefreshEvent } from './reminder-events';

/**
 * Create Reminder Template Input
 */
export type CreateReminderTemplateInput = CreateReminderTemplateRequest;

/**
 * Create Reminder Template
 */
export class CreateReminderTemplate {
  private static instance: CreateReminderTemplate;

  private constructor(private readonly apiClient: IReminderApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IReminderApiClient): CreateReminderTemplate {
    const container = ReminderContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CreateReminderTemplate.instance = new CreateReminderTemplate(client);
    return CreateReminderTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateReminderTemplate {
    if (!CreateReminderTemplate.instance) {
      CreateReminderTemplate.instance = CreateReminderTemplate.createInstance();
    }
    return CreateReminderTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateReminderTemplate.instance = undefined as unknown as CreateReminderTemplate;
  }

  /**
   * 执行用例
   */
  async execute(input: CreateReminderTemplateInput): Promise<ReminderTemplate> {
    const templateDTO = await this.apiClient.createReminderTemplate(input);
    const template = ReminderTemplate.fromClientDTO(templateDTO);

    this.publishEvent(template.uuid, ReminderTemplateEvents.TEMPLATE_CREATED);

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
export const createReminderTemplate = (input: CreateReminderTemplateInput): Promise<ReminderTemplate> =>
  CreateReminderTemplate.getInstance().execute(input);
