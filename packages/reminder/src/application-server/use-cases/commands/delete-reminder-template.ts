/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import { ReminderPolicy } from '@/domain-server/services/ReminderPolicy';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplate {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(id: string, _identityId: string): Promise<void> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return; // 幂等性
    }

    const policy = new ReminderPolicy();
    policy.assertTemplateDeletable(template, false);

    template.softDelete();
    await this.templateRepository.save(template);
  }
}
