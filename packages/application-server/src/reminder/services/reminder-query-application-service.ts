import type {
  IReminderTemplateRepository,
} from '@dailyuse/domain-server/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

/**
 * Reminder Query Application Service
 * Separated query logic for reminders
 */
export class ReminderQueryApplicationService {
  constructor(private reminderTemplateRepository: IReminderTemplateRepository) {}

  async getUpcomingReminders(accountUuid: string): Promise<ReminderTemplateClientDTO[]> {
    // This requires specific query logic from repository
    // For now assuming a basic fetch or reuse of active templates
    const templates = await this.reminderTemplateRepository.findActiveByAccount(accountUuid);
    return templates.map(t => t.toClientDTO());
  }
}
