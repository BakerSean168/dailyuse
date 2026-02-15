/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateRequest,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
import { ReminderPolicy } from '../../domain-server/services/ReminderPolicy';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplate {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository?: IReminderGroupRepository,
  ) {}

  async execute(
    uuid: string,
    request: UpdateReminderTemplateRequest,
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.templateRepository.findById(uuid);
    if (!template) {
      throw new Error(`Reminder Template ${uuid} not found`);
    }

    const policy = new ReminderPolicy();
    const group =
      request.groupUuid !== undefined && request.groupUuid !== null && this.groupRepository
        ? await this.groupRepository.findById(request.groupUuid)
        : null;

    if (request.groupUuid !== undefined && request.groupUuid !== null && !group) {
      throw new Error(`Invalid groupUuid: ${request.groupUuid}`);
    }

    if (request.groupUuid !== undefined) {
      policy.assertValidGroupAssignment(template, group);
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

    if (request.groupUuid !== undefined) {
      template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    }

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
