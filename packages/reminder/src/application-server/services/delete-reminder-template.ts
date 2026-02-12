/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import { eventBus } from '@dailyuse/utils';
// import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplate {
  
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(uuid: string, accountUuid: string): Promise<void> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      return; // 幂等性
    }

    // 直接通过仓储删除
    await this.templateRepository.delete(uuid);

    // 发布删除事件
    try {
      await eventBus.publish({
        eventType: 'reminder.template.deleted',
        payload: {
          reminderUuid: uuid,
          accountUuid: accountUuid,
          deletedAt: Date.now(),
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`❌ [DeleteReminderTemplate] 发布删除事件失败:`, error);
    }
  }
}
