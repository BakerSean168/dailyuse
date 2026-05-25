/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/i-reminder-template-repository';
import type { IReminderGroupRepository } from '@/domain-server/repositories/i-reminder-group-repository';
import { ReminderPolicy } from '@/domain-server/services/index';
import { ReminderTemplate } from '@/domain-server/aggregates/reminder-template';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import { IdentityId } from '@dailyuse/domain-shared';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplateUseCase {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
  ) {}

  async execute(
    input: CreateReminderTemplateReq,
    cx: ExecutionContext,
  ): Promise<Result<ReminderTemplateClientDTO>> {
    const policy = new ReminderPolicy();
    const group = input.groupId ? await this.groupRepository.findById(input.groupId) : null;

    if (input.groupId && !group) {
      return error('NOT_FOUND', `Invalid groupId: ${input.groupId}`);
    }

    const normalizedInput = {
      ...input,
      activeTime: {
        activatedAt: input.activeTime.startDate,
      },
      activeHours: input.activeHours
        ? {
            enabled: true,
            startHour: input.activeHours.startHour,
            endHour: input.activeHours.endHour,
          }
        : undefined,
      notificationConfig: {
        ...input.notificationConfig,
        actions: input.notificationConfig.actions ?? null,
      },
      importanceLevel: input.importanceLevel,
    };

    const template = ReminderTemplate.create({
      ...normalizedInput,
      identityId: IdentityId.of(cx.identityId),
    });

    policy.assertValidGroupAssignment(template, group);
    template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    await this.templateRepository.save(template);

    return ok(template.toClientDTO());
  }
}
