import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { ReminderTemplateClientDTO } from '@memoflow/contracts/reminder';
import type { ReminderTemplate } from '../../../domain/aggregates/reminder-template';

/**
 * Reminder Query Application Service
 * Separated query logic for reminders
 */
export class ReminderQueryApplicationServiceUseCase {
  constructor(private reminderTemplateRepository: IReminderTemplateRepository) {}

  async getUpcomingReminders(cx: ExecutionContext): Promise<Result<ReminderTemplateClientDTO[]>> {
    const templates = await this.reminderTemplateRepository.findByIdentityId(cx.identityId);
    return ok(templates.map((t: ReminderTemplate) => t.toClientDTO()));
  }
}
