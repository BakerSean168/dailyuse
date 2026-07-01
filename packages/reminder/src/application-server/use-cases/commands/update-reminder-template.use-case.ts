/**
 * Update Reminder Template Service
 *
 * 更新提醒模板
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '@/domain-server/repositories/i-reminder-group-repository';
import type {
  ReminderTemplateClientDTO,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import { ReminderDomainService, ReminderPolicy } from '@/domain-server/services/index';
import { ReminderTemplateClientMapper } from '../../mappers/reminder-template-client.mapper';

/**
 * Update Reminder Template Service
 */
export class UpdateReminderTemplateUseCase {
  private readonly reminderDomainService: ReminderDomainService;
  private readonly templateMapper: ReminderTemplateClientMapper;

  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
    reminderDomainService?: ReminderDomainService,
    templateMapper?: ReminderTemplateClientMapper,
  ) {
    this.reminderDomainService =
      reminderDomainService ?? new ReminderDomainService(templateRepository, groupRepository);
    this.templateMapper =
      templateMapper ?? new ReminderTemplateClientMapper(this.reminderDomainService, groupRepository);
  }

  async execute(
    id: string,
    request: UpdateReminderTemplateReq,
    cx: ExecutionContext,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    const template = await this.templateRepository.findById(id);
    if (!template || String(template.identityId) !== cx.identityId) {
      return error('NOT_FOUND', `Reminder Template ${id} not found`);
    }

    const policy = new ReminderPolicy();
    const previousGroupId = template.groupId;
    const group =
      request.groupId !== undefined && request.groupId !== null
        ? await this.groupRepository.findById(request.groupId)
        : null;

    if (
      request.groupId !== undefined &&
      request.groupId !== null &&
      (!group || String(group.identityId) !== cx.identityId)
    ) {
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

    await this.reminderDomainService.syncTemplateEffectiveEnabled(template);
    await this.templateRepository.save(template);

    if (previousGroupId && previousGroupId !== template.groupId) {
      await this.reminderDomainService.updateGroupStats(previousGroupId);
    }
    if (template.groupId) {
      await this.reminderDomainService.updateGroupStats(template.groupId);
    }

    return ok(await this.templateMapper.toDTO(template));
  }
}
