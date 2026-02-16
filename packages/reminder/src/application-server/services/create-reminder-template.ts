/**
 * Create Reminder Template Service
 *
 * 创建提醒模板
 */

import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import { ReminderPolicy } from '../../domain-server/services/ReminderPolicy';
import { ReminderTemplate } from '../../domain-server/aggregates/reminder-template';
import type {
  ReminderTemplateClientDTO,
  CreateReminderTemplateRequest,
} from '@dailyuse/contracts/reminder';
import { eventBus } from '@dailyuse/utils';
import { IdentityId } from '@dailyuse/domain-shared';

/**
 * Create Reminder Template Service
 */
export class CreateReminderTemplate {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly groupRepository: IReminderGroupRepository,
  ) {
  }

  async execute(identityId: string, input: CreateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    const policy = new ReminderPolicy();
    const group = input.groupId
      ? await this.groupRepository.findById(input.groupId)
      : null;

    if (input.groupId && !group) {
      throw new Error(`Invalid groupId: ${input.groupId}`);
    }

    const template = ReminderTemplate.create({
      ...input,
      identityId: IdentityId.of(identityId),
    });

    policy.assertValidGroupAssignment(template, group);
    template.setEffectiveEnabled(policy.calculateEffectiveEnabled(template, group));
    await this.templateRepository.save(template);

    // 发布领域事件
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
