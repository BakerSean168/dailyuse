import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

/**
 * Reminder Query Application Service
 * Separated query logic for reminders
 */
export class ReminderQueryApplicationService {
  constructor(private reminderTemplateRepository: IReminderTemplateRepository) {}

  async getUpcomingReminders(identityId: string): Promise<ReminderTemplateClientDTO[]> {
    const templates = await this.reminderTemplateRepository.findByIdentityId(identityId);
    return templates.map((t: any) => t.toClientDTO());
  }
}
