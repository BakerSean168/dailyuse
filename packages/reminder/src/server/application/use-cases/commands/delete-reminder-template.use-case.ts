/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import { ReminderPolicy } from '../../../domain/services/index';
import type { ReminderDomainService } from '../../../domain/services/reminder-domain-service';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplateUseCase {
  constructor(
    private readonly templateRepository: IReminderTemplateRepository,
    private readonly reminderDomainService?: Pick<ReminderDomainService, 'deleteTemplate'>,
  ) {}

  async execute(id: string, cx: ExecutionContext): Promise<Result<void>> {
    const template = await this.templateRepository.findByIdForIdentity(cx.identityId, id);
    if (!template) {
      return error('NOT_FOUND', `Reminder Template ${id} not found`);
    }

    if (this.reminderDomainService) {
      await this.reminderDomainService.deleteTemplate(id, true);
      return ok(undefined);
    }

    const policy = new ReminderPolicy();
    try {
      policy.assertTemplateDeletable(template, false);
    } catch (err) {
      return error('BAD_REQUEST', err instanceof Error ? err.message : 'Template is not deletable');
    }

    template.softDelete();
    await this.templateRepository.save(template);

    return ok(undefined);
  }
}
