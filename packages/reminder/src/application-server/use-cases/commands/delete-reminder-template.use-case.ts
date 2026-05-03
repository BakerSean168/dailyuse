/**
 * Delete Reminder Template Service
 *
 * 删除提醒模板
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '@/domain-server/repositories/IReminderTemplateRepository';
import { ReminderPolicy } from '@/domain-server/services/ReminderPolicy';

/**
 * Delete Reminder Template Service
 */
export class DeleteReminderTemplateUseCase {
  constructor(private readonly templateRepository: IReminderTemplateRepository) {}

  async execute(id: string, _cx: ExecutionContext): Promise<Result<void>> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      return ok(undefined); // 幂等性
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
