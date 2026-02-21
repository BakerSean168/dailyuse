/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '@/domain-server/repositories/IReminderGroupRepository';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
import { ReminderPolicy } from '@/domain-server/services/ReminderPolicy';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplate {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository?: IReminderGroupRepository,
  ) {}

  async execute(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error(`Reminder Template ${id} not found`);
    }

    const policy = new ReminderPolicy();
    const group =
      request.groupId !== undefined && request.groupId !== null && this.groupRepository
        ? await this.groupRepository.findById(request.groupId)
        : null;

    if (request.groupId !== undefined && request.groupId !== null && !group) {
      throw new Error(`Invalid groupId: ${request.groupId}`);
    }

    if (request.groupId !== undefined) {
      policy.assertValidGroupAssignment(template, group);
    }

    // Use domain entity's update method
    template.update({
      title: request.title,
      description: request.description,
      activeTime: request.activeTime
        ? { activatedAt: request.activeTime.startDate }
        : undefined,
      notificationConfig: request.notificationConfig
        ? {
            ...request.notificationConfig,
            actions: request.notificationConfig.actions ?? null,
          }
        : undefined,
      recurrence: request.recurrence
        ? {
            ...request.recurrence,
            weekly: request.recurrence.weekly ?? null,
          }
        : undefined,
      activeHours: request.activeHours
        ? {
            enabled: true,
            startHour: request.activeHours.startHour,
            endHour: request.activeHours.endHour,
          }
        : undefined,
      importanceLevel: request.importanceLevel,
      tags: request.tags,
      color: request.color,
      icon: request.icon,
      groupId: request.groupId,
    });

    if (request.groupId !== undefined) {
      template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    }

    // Save to repository
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.pullDomainEvents();
    for (const event of events) {
      const payload = event.payload as Record<string, unknown>;
      eventBus.send(event.eventType as any, {
        ...payload,
        reminderData: template.toServerDTO(),
      } as any);
    }

    return template.toClientDTO();
  }
}
