/**
 * Get Reminder Template Service
 *
 * 获取提醒模板详情
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

/**
 * Get Reminder Template Service
 */
export class GetReminderTemplate {
  
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(id: string): Promise<ReminderTemplateClientDTO | null> {
    const template = await this.templateRepository.findById(id);
    return template ? template.toClientDTO() : null;
  }
}
