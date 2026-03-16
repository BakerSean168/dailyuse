/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import { eventBus } from '@dailyuse/utils';
import { ReminderPolicy } from '@/domain-server/services/ReminderPolicy';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplate {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(id: string, identityId: string): Promise<void> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return; // 幂等性
    }

    const policy = new ReminderPolicy();
    policy.assertTemplateDeletable(template, false);

    template.softDelete();
    await this.templateRepository.save(template);

    // 发布删除事件
    try {
      eventBus.send(
        'reminder:template:deleted' as any,
        {
          reminderId: id,
          identityId: identityId,
          deletedAt: Date.now(),
        } as any,
      );
    } catch (error) {
      console.error(`❌ [DeleteReminderTemplate] 发布删除事件失败:`, error);
    }
  }
}
