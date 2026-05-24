/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '@/domain-server/repositories/i-reminder-group-repository';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import { ReminderPolicy } from '@/domain-server/services/index';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplateUseCase {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository?: IReminderGroupRepository,
  ) {}

  async execute(
    id: string,
    request: UpdateReminderTemplateReq,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return error('NOT_FOUND', `Reminder Template ${id} not found`);
    }

    const policy = new ReminderPolicy();
    const group =
      request.groupId !== undefined && request.groupId !== null && this.groupRepository
        ? await this.groupRepository.findById(request.groupId)
        : null;

    if (request.groupId !== undefined && request.groupId !== null && !group) {
      return error('NOT_FOUND', `Invalid groupId: ${request.groupId}`);
    }

    if (request.groupId !== undefined) {
      policy.assertValidGroupAssignment(template, group);
    }

    // Use domain entity's update method
    template.update({
      title: request.title,
      description: request.description,
      activeTime: request.activeTime ? { activatedAt: request.activeTime.startDate } : undefined,
      notificationConfig: request.notificationConfig
        ? {
            ...request.notificationConfig,
            actions: request.notificationConfig.actions ?? null,
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

    return ok(template.toClientDTO());
  }
}
