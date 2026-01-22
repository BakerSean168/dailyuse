/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplate {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.templateRepository.findById(uuid);
    return template ? template.toClientDTO() : null;
  }
}
