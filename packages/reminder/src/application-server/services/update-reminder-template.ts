/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { IReminderTemplateRepository } from '@/domain-server';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateRequest,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplate {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(
    uuid: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      throw new Error(`Reminder Template ${uuid} not found`);
    }

    // Use domain entity's update method
    template.update({
      title: request.title,
      description: request.description,
      activeTime: request.activeTime,
      notificationConfig: request.notificationConfig,
      recurrence: request.recurrence,
      activeHours: request.activeHours,
      importanceLevel: request.importanceLevel,
      tags: request.tags,
      color: request.color,
      icon: request.icon,
      groupUuid: request.groupUuid,
    });

    // Save to repository
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getDomainEvents();
    for (const event of events) {
      const payload = event.payload as Record<string, unknown>;
      await eventBus.publish({
        ...event,
        payload: {
          ...payload,
          reminderData: template.toServerDTO(),
        },
      });
    }

    return template.toClientDTO();
  }
}
