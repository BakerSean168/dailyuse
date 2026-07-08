import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IReminderTemplateRepository } from '../../../domain/repositories/i-reminder-template-repository';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
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
